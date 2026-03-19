import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

// 従業員が「受注可能」一覧を取得する用。RLSで未割り当て注文が読めない場合にサービスロールで取得する
serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

  try {
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
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "";
    if (role !== "employee" && role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "従業員または管理者のみ利用できます" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, user_id, service_type, game_title, status, price, payout_amount, current_rank, target_rank, current_trophy, target_trophy, character_name, character_strength, notes, created_at")
      .in("status", ["paid", "pending", "open", "PAYMENT_PENDING"])
      .is("employee_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("list-available-orders error:", error);
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ success: true, data: orders ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("list-available-orders:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
