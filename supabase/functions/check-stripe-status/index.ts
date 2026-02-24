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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return new Response(
        JSON.stringify({
          success: true,
          has_account: false,
          details_submitted: false,
          payouts_enabled: false,
          status: "not_created",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Stripeに実際のアカウント状態を問い合わせ
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    // details_submitted = 必要な情報がすべて入力済み
    // payouts_enabled = 実際に送金できる状態
    let status = "incomplete"; // アカウント作成済みだが未完了
    if (account.details_submitted && account.payouts_enabled) {
      status = "active"; // 完全に有効
    } else if (account.details_submitted) {
      status = "pending"; // 入力済みだがStripe審査待ち
    }

    // DBの状態も更新（details_submittedがfalseならstripe_account_idをクリアしない）
    // → 再度オンボーディングリンクを発行するため保持

    return new Response(
      JSON.stringify({
        success: true,
        has_account: true,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        status: status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Check stripe status error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
