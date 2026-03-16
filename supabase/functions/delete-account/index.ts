import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ユーザー認証
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    const userId = user.id;

    // 1. 進行中の注文をキャンセル（依頼者として）
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .in("status", ["paid", "pending", "open", "assigned", "in_progress"]);

    // 2. 受注中の案件から外す（従業員として）
    await supabase
      .from("orders")
      .update({ employee_id: null, status: "paid" })
      .eq("employee_id", userId)
      .in("status", ["assigned", "in_progress"]);

    // 3. プロフィールを論理削除 + データ匿名化
    await supabase
      .from("profiles")
      .update({
        is_banned: true,
        deleted_at: new Date().toISOString(),
        username: "削除済みユーザー",
        full_name: null,
        balance: 0,
      })
      .eq("id", userId);

    // 4. Supabase auth ユーザーを削除
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Auth user deletion failed:", deleteError.message);
      // auth削除が失敗してもプロフィールは論理削除済みなので続行
    }

    return new Response(
      JSON.stringify({ success: true, message: "アカウントを削除しました" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("delete-account error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
