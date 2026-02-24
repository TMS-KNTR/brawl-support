import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
      },
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

    let event: Stripe.Event;

    if (webhookSecret) {
      // 署名検証（本番用） - Deno環境ではasync版を使う
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      // 署名検証スキップ（テスト用フォールバック）
      console.warn("STRIPE_WEBHOOK_SECRET not set, parsing event without verification");
      event = JSON.parse(body);
    }

    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session: any = event.data.object;
      const orderId = session.metadata?.order_id;

      console.log("Checkout completed. order_id:", orderId);

      if (orderId) {
        // payment_intentを保存（返金に必要）
        const paymentIntentId = session.payment_intent;
        console.log("Payment Intent ID:", paymentIntentId);

        const { error } = await supabase
          .from("orders")
          .update({ status: "paid", payment_intent_id: paymentIntentId })
          .eq("id", orderId);

        if (error) {
          console.error("Failed to update order:", error);
          return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
        }

        console.log("Order updated to paid:", orderId);

        // チャットスレッドを自動作成（まだ存在しない場合のみ）
        const { data: existingThread } = await supabase
          .from("chat_threads")
          .select("id")
          .eq("order_id", orderId)
          .maybeSingle();

        if (!existingThread) {
          // order情報を取得して参加者を設定
          const { data: orderData } = await supabase
            .from("orders")
            .select("user_id, employee_id")
            .eq("id", orderId)
            .single();

          const participants = [orderData?.user_id].filter(Boolean);

          const { error: threadError } = await supabase
            .from("chat_threads")
            .insert({
              order_id: orderId,
              participants: participants,
            });

          if (threadError) {
            console.error("Failed to create chat thread:", threadError);
          } else {
            console.log("Chat thread created for order:", orderId);
          }
        }
      } else {
        console.warn("No order_id in session metadata");
      }
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
