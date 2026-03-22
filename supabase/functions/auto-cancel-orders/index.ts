import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

/** Stripe API呼び出しをリトライ */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable = err.type === "StripeConnectionError" || err.type === "StripeAPIError" || err.code === "ECONNRESET";
      if (i < maxRetries && isRetryable) {
        console.warn(`[retry] Stripe API failed, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- 認証: service_role_key（pg_cron）/ 内部シークレット / 管理者JWT ---
    const authHeader = req.headers.get("Authorization");
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedSecret = Deno.env.get("INTERNAL_NOTIFICATION_SECRET");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // タイミング攻撃対策の定数時間比較
    function timingSafeEqual(a: string, b: string): boolean {
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return result === 0;
    }

    if (internalSecret && expectedSecret && timingSafeEqual(internalSecret, expectedSecret)) {
      // 内部シークレット一致 — OK
    } else if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (serviceRoleKey && timingSafeEqual(token, serviceRoleKey)) {
        // pg_cron からの service_role_key — OK
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser(token);
        if (!user) {
          throw new Error("認証が必要です");
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role !== "admin") {
          throw new Error("管理者権限が必要です");
        }
      }
    } else {
      throw new Error("認証が必要です");
    }

    // --- 自動キャンセル時間を取得 (デフォルト48時間) ---
    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "auto_cancel_hours")
      .maybeSingle();

    const autoCancelHours = Number(setting?.value) || 48;

    // --- 期限切れ注文を検索 ---
    const cutoff = new Date(
      Date.now() - autoCancelHours * 60 * 60 * 1000
    ).toISOString();

    const { data: expiredOrders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["paid", "PAYMENT_PENDING"])
      .is("employee_id", null)
      .eq("is_refunded", false)
      .lt("created_at", cutoff);

    if (fetchError) throw new Error("注文取得エラー: " + fetchError.message);
    if (!expiredOrders || expiredOrders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "対象注文なし", cancelled: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[auto-cancel] ${expiredOrders.length}件の期限切れ注文を検出 (閾値: ${autoCancelHours}時間)`
    );

    const results: { order_id: string; success: boolean; error?: string; refund_id?: string }[] = [];

    for (const order of expiredOrders) {
      try {
        const isPaid = order.status === "paid";

        // --- Stripe 返金 (決済済みの場合のみ) ---
        let refundResult = null;
        if (isPaid) {
          const paymentIntentId = order.payment_intent_id;
          const sessionId = order.stripe_checkout_session_id || order.stripe_session_id;

          if (paymentIntentId) {
            refundResult = await withRetry(() => stripe.refunds.create({ payment_intent: paymentIntentId }, {
              idempotencyKey: `auto-cancel-refund-${order.id}`,
            }));
          } else if (sessionId) {
            const session = await withRetry(() => stripe.checkout.sessions.retrieve(sessionId));
            if (session.payment_intent) {
              refundResult = await withRetry(() => stripe.refunds.create({
                payment_intent: session.payment_intent as string,
              }, {
                idempotencyKey: `auto-cancel-refund-${order.id}`,
              }));
            }
          }
        }

        // --- 注文ステータス更新 ---
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            is_refunded: isPaid,
            refund_id: refundResult?.id || null,
            refunded_at: isPaid ? new Date().toISOString() : null,
          })
          .eq("id", order.id);

        if (updateError) {
          console.error(`[auto-cancel] DB更新失敗 ${order.id}:`, updateError);
        }

        // --- 顧客に通知 ---
        const customerId = order.user_id;
        if (customerId) {
          const { error: notifError } = await supabase.from("notifications").insert({
            user_id: customerId,
            type: "order_cancelled",
            title: "注文が自動キャンセルされました",
            body: isPaid
              ? `注文が${autoCancelHours}時間以内に受注されなかったため、自動キャンセルされました。全額返金されます。`
              : `注文が${autoCancelHours}時間以内に決済・受注されなかったため、自動キャンセルされました。`,
            link_url: "/dashboard/customer",
          });
          if (notifError) console.error(`[auto-cancel] 通知失敗 ${order.id}:`, notifError);
        }

        // --- 監査ログ ---
        const { error: logError } = await supabase.from("admin_logs").insert({
          action: "order_auto_cancelled",
          target_type: "order",
          target_id: order.id,
          details: `${autoCancelHours}時間未受注のため自動キャンセル${isPaid ? "+返金" : ""}`,
          meta_json: {
            auto_cancel_hours: autoCancelHours,
            refund_id: refundResult?.id || null,
            amount: refundResult?.amount || order.price || 0,
            original_status: order.status,
          },
        });
        if (logError) console.error("[auto-cancel] 監査ログ失敗:", logError);

        results.push({ order_id: order.id, success: true, refund_id: refundResult?.id });
        console.log(`[auto-cancel] 成功: ${order.id}`);
      } catch (orderErr: any) {
        console.error(`[auto-cancel] 失敗: ${order.id} - ${orderErr.message}`);
        results.push({ order_id: order.id, success: false, error: orderErr.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `自動キャンセル完了: 成功${successCount}件, 失敗${failCount}件`,
        cancelled: successCount,
        failed: failCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[auto-cancel] エラー:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
