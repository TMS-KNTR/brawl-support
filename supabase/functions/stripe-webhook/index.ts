import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  // CORSプリフライト
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: getCorsHeaders(req),
    });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No stripe-signature header");
      return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500 });
    }

    let event: Stripe.Event;

    // 署名検証 - Deno環境ではasync版を使う
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session: any = event.data.object;
      const meta = session.metadata || {};
      const customerId = meta.customer_id;
      const paymentIntentId = session.payment_intent;

      console.log("Checkout completed. customer_id:", customerId, "payment_intent:", paymentIntentId);

      if (!customerId) {
        console.warn("No customer_id in session metadata");
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // メタデータから注文情報を取得
      const totalPrice = Number(meta.total_price) || 0;
      const payoutAmount = Number(meta.payout_amount) || 0;

      if (totalPrice <= 0 || payoutAmount <= 0) {
        console.error("Invalid price data in metadata:", { totalPrice, payoutAmount, meta });
        return new Response(JSON.stringify({ received: true, error: "invalid price metadata" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Stripe決済額とメタデータの照合（改ざん防止）
      const stripeAmount = session.amount_total ?? session.amount_subtotal;
      if (stripeAmount != null && stripeAmount !== totalPrice) {
        console.error("Price mismatch! stripe_amount:", stripeAmount, "metadata_price:", totalPrice);
        return new Response(JSON.stringify({ received: true, error: "price mismatch" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 冪等性: 同じsession_idで既に注文が作成されていないか確認
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      if (existingOrder) {
        console.log("Order already exists for session:", session.id);
        // 既存の注文をpaidに更新（念のため）
        await supabase
          .from("orders")
          .update({ status: "paid", payment_intent_id: paymentIntentId })
          .eq("id", existingOrder.id);
        return new Response(JSON.stringify({ received: true, existing: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 注文を作成（決済完了済み）
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: customerId,
          current_rank: meta.current_rank || null,
          target_rank: meta.target_rank || null,
          game_title: "Brawl Stars",
          service_type: meta.service_type || "trophy",
          price: totalPrice,
          payout_amount: payoutAmount,
          platform_fee: Number(meta.platform_fee) || 0,
          status: "paid",
          payment_intent_id: paymentIntentId,
          stripe_checkout_session_id: session.id,
          notes: meta.notes || null,
        })
        .select()
        .single();

      if (orderError) {
        console.error("Failed to create order:", orderError);
        return new Response(JSON.stringify({ error: "Order creation failed" }), { status: 500 });
      }

      console.log("Order created:", order.id);

      // チャットスレッドを作成（失敗時はリトライ）
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error: threadError } = await supabase
          .from("chat_threads")
          .insert({
            order_id: order.id,
            participants: [customerId],
          });

        if (!threadError) {
          console.log("Chat thread created for order:", order.id);
          break;
        }
        console.error(`Failed to create chat thread (attempt ${attempt + 1}/3):`, threadError);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
      }

      // 監査ログ
      try {
        await supabase.from("admin_logs").insert({
          actor_user_id: customerId,
          action: "ORDER_CREATED",
          target_type: "order",
          target_id: order.id,
          meta_json: {
            currentRank: meta.current_rank,
            targetRank: meta.target_rank,
            totalPrice,
            sessionId: session.id,
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
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
