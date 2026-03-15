// ============================================
// accept-order（丸ごとコピペ用）
// ============================================
// Supabase ダッシュボード → Edge Functions → accept-order を開く
// → エディタの内容をすべて削除して、このファイルの中身をそのまま貼り付ける
// → Deploy を押す
// ============================================

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

    const role = (profile?.role ?? "").toString().toLowerCase();
    if (role !== "employee" && role !== "worker" && role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "従業員または管理者のみ利用できます" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const orderId = body?.order_id ?? body?.orderId;
    if (!orderId || typeof orderId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "order_id が必要です" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ employee_id: user.id, status: "assigned" })
      .eq("id", orderId)
      .is("employee_id", null)
      .select("id");

    if (updateError) {
      console.error("accept-order update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!updated || updated.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "すでに他の従業員が受注しているか、注文が見つかりません" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: thread } = await supabase
      .from("chat_threads")
      .select("id, participants")
      .eq("order_id", orderId)
      .maybeSingle();

    if (thread) {
      const raw = thread.participants;
      const list = Array.isArray(raw)
        ? [...raw, user.id]
        : typeof raw === "string"
          ? (() => {
              try {
                const arr = JSON.parse(raw);
                return Array.isArray(arr) ? [...arr, user.id] : [user.id];
              } catch {
                return [user.id];
              }
            })()
          : [user.id];
      await supabase
        .from("chat_threads")
        .update({ participants: list })
        .eq("id", thread.id);
    } else {
      const { data: orderRow } = await supabase
        .from("orders")
        .select("user_id, customer_id")
        .eq("id", orderId)
        .single();

      const customerId = orderRow?.user_id ?? orderRow?.customer_id;
      const participants = [customerId, user.id].filter(Boolean);
      if (participants.length > 0) {
        await supabase
          .from("chat_threads")
          .insert({ order_id: orderId, participants });
      }
    }

    return new Response(
      JSON.stringify({ success: true, order_id: orderId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("accept-order:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
