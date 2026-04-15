import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  // CORSプリフライト
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    // --- 認証: auth_token ヘッダーで検証 ---
    const authToken = req.headers.get("authorization");
    const expectedToken = Deno.env.get("UNIVAPAY_WEBHOOK_AUTH_TOKEN");

    if (!expectedToken) {
      console.error("UNIVAPAY_WEBHOOK_AUTH_TOKEN is not configured");
      return new Response(JSON.stringify({ error: "Webhook auth not configured" }), { status: 500 });
    }

    // UnivaPay は Bearer トークンとして auth_token を送信する
    const token = authToken?.replace("Bearer ", "") ?? "";
    if (token !== expectedToken) {
      console.error("Invalid webhook auth token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const payload = await req.json();
    // 本番投入初期のペイロード構造確認用（動作確認後に削除可）
    console.log("UnivaPay webhook raw payload:", JSON.stringify(payload));
    const event = payload.event;

    console.log("UnivaPay webhook event received:", event);

    // charge_finished: クレカ/即時決済用
    // charge_updated: コンビニ/銀行振込など非同期決済の入金検知用
    if (event === "charge_finished" || event === "charge_updated") {
      const data = payload.data;
      const chargeId = data?.id;
      const chargeStatus = data?.status;
      // UnivaPay API: requested_amount = 請求額, charged_amount = 実決済額（JPYでは一致）
      const chargeAmount = data?.charged_amount ?? data?.requested_amount;
      const metadata = data?.metadata ?? {};
      const orderId = metadata?.order_id;
      const customerId = metadata?.customer_id;
      const paymentType = data?.payment_type ?? data?.transaction_token_type;

      console.log("Charge finished:", { chargeId, chargeStatus, chargeAmount, orderId });

      if (!orderId) {
        console.warn("No order_id in charge metadata");
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 課金が成功していない場合
      if (chargeStatus !== "successful") {
        // awaiting / pending はコンビニ/銀行振込で入金待ちの正常状態なので何もしない
        if (chargeStatus === "awaiting" || chargeStatus === "pending") {
          console.log("Charge awaiting payment (正常):", chargeStatus);
          return new Response(JSON.stringify({ received: true, awaiting: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        // failed / error / canceled は失敗扱い
        console.warn("Charge not successful:", chargeStatus);
        await supabase
          .from("orders")
          .update({ status: "payment_failed" })
          .eq("id", orderId)
          .eq("status", "pending_payment");
        return new Response(JSON.stringify({ received: true, charge_failed: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 仮注文を取得
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, price, status, univapay_charge_id")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        console.error("Order not found:", orderId, orderError);
        return new Response(JSON.stringify({ received: true, error: "order not found" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 冪等性: 既にcharge_idが設定されていればスキップ
      if (order.univapay_charge_id) {
        console.log("Order already has charge_id:", order.univapay_charge_id);
        return new Response(JSON.stringify({ received: true, existing: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 金額照合（改ざん防止）— nullは不正ペイロードとして扱う
      if (chargeAmount == null || chargeAmount !== order.price) {
        console.error("Price mismatch or missing! charge_amount:", chargeAmount, "order_price:", order.price);
        await supabase
          .from("orders")
          .update({ status: "payment_failed" })
          .eq("id", orderId)
          .eq("status", "pending_payment");
        return new Response(JSON.stringify({ received: true, error: "price mismatch" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 注文を paid に更新
      // webhook が payment_type を返す場合はそれを保存（既に設定済みなら上書きしない想定でもOK）
      const updatePayload: Record<string, any> = {
        status: "paid",
        univapay_charge_id: chargeId,
      };
      if (paymentType && typeof paymentType === "string") {
        // UnivaPay の payment_type を内部名に正規化
        const normalized =
          paymentType === "card" ? "credit_card" :
          paymentType === "konbini" ? "konbini" :
          paymentType === "bank_transfer" ? "bank_transfer" :
          null;
        if (normalized) updatePayload.payment_method = normalized;
      }
      const { error: updateError } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId)
        .in("status", ["pending_payment", "paid"]); // pending_payment → paid、既にpaidなら冪等

      if (updateError) {
        console.error("Failed to update order:", updateError);
        return new Response(JSON.stringify({ error: "Order update failed" }), { status: 500 });
      }

      console.log("Order updated to paid:", orderId);

      // チャットスレッドを作成（まだ無ければ）
      const { data: existingThread } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (!existingThread) {
        for (let attempt = 0; attempt < 3; attempt++) {
          const { error: threadError } = await supabase
            .from("chat_threads")
            .insert({
              order_id: orderId,
              participants: [customerId],
            });

          if (!threadError) {
            console.log("Chat thread created for order:", orderId);
            break;
          }
          console.error(`Failed to create chat thread (attempt ${attempt + 1}/3):`, threadError);
          if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
        }
      }

      // 顧客に支払い完了通知（コンビニ/銀行振込の場合も気づけるように）
      try {
        await supabase.from("notifications").insert({
          user_id: customerId,
          type: "payment_confirmed",
          title: "お支払いが確認されました",
          body: `ご注文 ¥${order.price.toLocaleString()} の決済が完了しました。代行者が見つかり次第、作業を開始します。`,
          link_url: "/dashboard/customer",
        });
      } catch (notifErr) {
        console.error("payment_confirmed 通知失敗:", notifErr);
      }

      // 監査ログ
      try {
        await supabase.from("admin_logs").insert({
          actor_user_id: customerId,
          action: "ORDER_CREATED",
          target_type: "order",
          target_id: orderId,
          meta_json: {
            chargeId,
            chargeAmount,
            provider: "univapay",
            paymentType,
          },
        });
      } catch { /* ログ失敗は無視 */ }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), { status: 400 });
  }
});
