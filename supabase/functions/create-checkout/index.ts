import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

  // このエンドポイントは廃止されました。create-order-payment を使用してください。
  return new Response(
    JSON.stringify({ error: "このエンドポイントは廃止されました。create-order-payment を使用してください。" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 410 }
  );
});
