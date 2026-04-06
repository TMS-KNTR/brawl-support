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
    const event = payload.event;

    console.log("UnivaPay webhook event received:", event);

    if (event === "charge_finished") {
      const data = payload.data;
      const chargeId = data?.id;
      const chargeStatus = data?.status;
      const chargeAmount = data?.requested_amount ?? data?.charged_amount ?? data?.amount;
      const metadata = data?.metadata ?? {};
      const orderId = metadata?.order_id;
      const customerId = metadata?.customer_id;

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
        console.warn("Charge not successful:", chargeStatus);
        // 仮注文を失敗に更新
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

      // 金額照合（改ざん防止）
      if (chargeAmount != null && chargeAmount !== order.price) {
        console.error("Price mismatch! charge_amount:", chargeAmount, "order_price:", order.price);
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
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          univapay_charge_id: chargeId,
        })
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
