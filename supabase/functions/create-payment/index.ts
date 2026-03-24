import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

  // このエンドポイントは廃止されました。create-order-payment を使用してください。
  return new Response(
    JSON.stringify({ error: "このエンドポイントは廃止されました。create-order-payment を使用してください。" }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
  )
})