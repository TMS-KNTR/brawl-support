import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

/** UnivaPay APIリクエスト */
async function univapayRequest(path: string, options: RequestInit = {}): Promise<any> {
  const secret = Deno.env.get("UNIVAPAY_SECRET");
  if (!secret) return null; // シークレット未設定の場合はAPI返金をスキップ

  const baseUrl = "https://api.univapay.com";
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json();
  if (!res.ok) {
    console.error("UnivaPay API error:", res.status, body);
    throw new Error(body?.error?.message || `UnivaPay API error: ${res.status}`);
  }
  return body;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

  try {
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

    // pending_payment（決済未完了の仮注文）は30分で自動削除
    const pendingPaymentCutoff = new Date(
      Date.now() - 30 * 60 * 1000
    ).toISOString();

    // 1. 決済未完了の仮注文をクリーンアップ
    const { data: abandonedOrders } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("status", "pending_payment")
      .lt("created_at", pendingPaymentCutoff);

    if (abandonedOrders && abandonedOrders.length > 0) {
      console.log(`[auto-cancel] ${abandonedOrders.length}件の決済未完了注文を削除`);
      for (const order of abandonedOrders) {
        await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", order.id)
          .eq("status", "pending_payment");
      }
    }

    // 2. 決済済みだが未受注の期限切れ注文を自動キャンセル+返金
    const { data: expiredOrders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["paid", "pending"])
      .is("employee_id", null)
      .eq("is_refunded", false)
      .lt("created_at", cutoff);

    if (fetchError) throw new Error("注文取得エラー: " + fetchError.message);
    if (!expiredOrders || expiredOrders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "対象注文なし",
          cancelled: 0,
          abandoned_cleaned: abandonedOrders?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[auto-cancel] ${expiredOrders.length}件の期限切れ注文を検出 (閾値: ${autoCancelHours}時間)`
    );

    const storeId = Deno.env.get("UNIVAPAY_STORE_ID");
    const results: { order_id: string; success: boolean; error?: string; refund_id?: string }[] = [];

    for (const order of expiredOrders) {
      try {
        const isPaid = order.status === "paid";

        // --- UnivaPay 返金 (決済済みの場合のみ) ---
        let refundResult = null;
        if (isPaid && order.univapay_charge_id && storeId) {
          try {
            refundResult = await univapayRequest(
              `/stores/${storeId}/charges/${order.univapay_charge_id}/refunds`,
              {
                method: "POST",
                body: JSON.stringify({
                  amount: order.price,
                  currency: "jpy",
                  reason: "customer_request",
                  message: `自動キャンセル返金 (order: ${order.id})`,
                  metadata: { order_id: order.id },
                }),
              }
            );
          } catch (refundErr: any) {
            console.error(`[auto-cancel] 返金失敗 ${order.id}:`, refundErr.message);
            // 返金失敗でもキャンセルは続行（管理者が手動対応）
          }
        }

        // --- 注文ステータス更新 ---
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            is_refunded: isPaid && !!refundResult,
            refund_id: refundResult?.id || null,
            refunded_at: refundResult ? new Date().toISOString() : null,
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
            body: isPaid && refundResult
              ? `注文が${autoCancelHours}時間以内に受注されなかったため、自動キャンセルされました。全額返金されます。`
              : isPaid
                ? `注文が${autoCancelHours}時間以内に受注されなかったため、自動キャンセルされました。返金処理中です。`
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
          details: `${autoCancelHours}時間未受注のため自動キャンセル${isPaid && refundResult ? "+返金" : ""}`,
          meta_json: {
            auto_cancel_hours: autoCancelHours,
            refund_id: refundResult?.id || null,
            amount: order.price || 0,
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
        abandoned_cleaned: abandonedOrders?.length || 0,
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
