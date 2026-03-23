import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    })

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Auth (any logged-in user, not admin-only) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    // =========================================================
    // action: get-admin-ids
    // Returns all profile IDs where role = 'admin'
    // =========================================================
    if (action === "get-admin-ids") {
      // 管理者のみ呼び出し可能
      const { data: callerProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (callerProfile?.role !== "admin") {
        return json({ success: false, error: "管理者権限が必要です" }, 403);
      }

      const { data: admins, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (error) {
        console.error("chat-data get-admin-ids error:", error);
        return json({ success: false, error: error.message }, 400);
      }

      return json({
        success: true,
        data: (admins ?? []).map((a: { id: string }) => a.id),
      });
    }

    // =========================================================
    // action: get-sender-profiles
    // Accepts { user_ids: string[], order_id: string }
    // Verifies the caller is a participant of the order, then
    // returns profiles (id, username, full_name, role).
    // =========================================================
    if (action === "get-sender-profiles") {
      const userIds: string[] | undefined = body?.user_ids;
      const orderId: string | undefined = body?.order_id;

      if (!Array.isArray(userIds) || userIds.length === 0 || !orderId) {
        return json({ success: false, error: "user_ids (array) と order_id が必要です" }, 400);
      }

      // Verify the requesting user is a participant of the order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("user_id, employee_id")
        .eq("id", orderId)
        .single();

      if (orderErr || !order) {
        return json({ success: false, error: "注文が見つかりません" }, 404);
      }

      const uid = user.id;
      if (order.user_id !== uid && order.employee_id !== uid) {
        // Also allow admins
        const { data: callerProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .single();

        if (callerProfile?.role !== "admin") {
          return json({ success: false, error: "この注文へのアクセス権限がありません" }, 403);
        }
      }

      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, username, full_name, role")
        .in("id", userIds);

      if (profilesErr) {
        console.error("chat-data get-sender-profiles error:", profilesErr);
        return json({ success: false, error: profilesErr.message }, 400);
      }

      return json({ success: true, data: profiles ?? [] });
    }

    // =========================================================
    // Unknown action
    // =========================================================
    return json({ success: false, error: `不明なアクション: ${action}` }, 400);

  } catch (err: any) {
    console.error("chat-data:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
