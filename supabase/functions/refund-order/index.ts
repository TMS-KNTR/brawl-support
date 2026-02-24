import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 管理者認証チェック
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    // 管理者チェック
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") throw new Error("管理者権限が必要です");

    // リクエストからorder_idを取得
    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_idが必要です");

    // 注文情報を取得
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) throw new Error("注文が見つかりません");
    if (order.status === "cancelled") throw new Error("既にキャンセル済みです");
    if (order.is_refunded) throw new Error("既に返金済みです");

    // payment_intent_idがある場合 → Stripeで返金
    let refundResult = null;
    if (order.payment_intent_id) {
      refundResult = await stripe.refunds.create({
        payment_intent: order.payment_intent_id,
      });
      console.log("Stripe refund created:", refundResult.id);
    } else if (order.stripe_checkout_session_id || order.stripe_session_id) {
      // payment_intent_idが無い場合、セッションから取得を試みる
      const sessionId = order.stripe_checkout_session_id || order.stripe_session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_intent) {
        refundResult = await stripe.refunds.create({
          payment_intent: session.payment_intent as string,
        });
        console.log("Stripe refund created via session:", refundResult.id);
      } else {
        throw new Error("payment_intentが見つかりません。Stripeダッシュボードから手動で返金してください。");
      }
    } else {
      throw new Error("決済情報が見つかりません。Stripeダッシュボードから手動で返金してください。");
    }

    // 注文ステータスを更新
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        is_refunded: true,
        refund_id: refundResult?.id || null,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("DB update failed:", updateError);
      throw new Error("返金は成功しましたが、DB更新に失敗しました。手動で確認してください。");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "返金が完了しました",
        refund_id: refundResult?.id,
        amount: refundResult?.amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Refund error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
