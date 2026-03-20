import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

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

    // 従業員チェック
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, stripe_account_id")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    if (!["worker", "employee", "admin"].includes(role || "")) {
      throw new Error("従業員権限が必要です");
    }

    let { return_url } = await req.json();

    // return_url のオープンリダイレクト防止
    const siteUrl = Deno.env.get("SITE_URL") || "https://gemsuke.com";
    if (return_url && !return_url.startsWith(siteUrl)) {
      return_url = null;
    }

    let accountId = profile?.stripe_account_id;

    // まだStripe Connectアカウントが無ければ作成
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "JP",
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // profilesにstripe_account_idを保存
      await supabase
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);

      console.log("Created Stripe Connect account:", accountId);
    }

    // オンボーディングリンクを生成
    const fallbackUrl = `${siteUrl}/dashboard/employee`;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: return_url || fallbackUrl,
      return_url: return_url || fallbackUrl,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: accountLink.url,
        account_id: accountId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Connect onboarding error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
