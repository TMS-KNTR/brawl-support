import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_STATUSES = ["in_progress", "completed"];

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
    const newStatus = body?.status;
    if (!orderId || typeof orderId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "order_id が必要です" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
      return new Response(
        JSON.stringify({ success: false, error: "status は in_progress または completed のみ指定できます" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .eq("employee_id", user.id)
      .select("id");

    if (updateError) {
      console.error("update-order-status error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!updated || updated.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "この案件を更新する権限がありません。自分が受注した案件のみ変更できます。" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: orderRow } = await supabase
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();
    const customerId = orderRow?.user_id;
    if (customerId) {
      const isProgress = newStatus === "in_progress";
      const title = isProgress ? "作業が開始されました" : "依頼が完了報告されました";
      const body = isProgress
        ? "代行者が作業を開始しました。"
        : "代行者が依頼完了を報告しました。内容を確認のうえ「完了を確認する」を押してください。";
      const notifType = isProgress ? "order_in_progress" : "order_completed";
      const { data: chatThread } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();
      const linkUrl = chatThread?.id ? `/chat/${chatThread.id}` : `/dashboard/customer`;

      await supabase.from("notifications").insert({
        user_id: customerId,
        type: notifType,
        title,
        body,
        link_url: linkUrl,
      });

      const secret = Deno.env.get("INTERNAL_NOTIFICATION_SECRET");
      const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification-email`;
      if (secret) {
        try {
          await fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": secret,
            },
            body: JSON.stringify({
              user_id: customerId,
              type: notifType,
              title,
              body,
              link_url: linkUrl,
            }),
          });
        } catch (e) {
          console.error("send-notification-email:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, order_id: orderId, status: newStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("update-order-status:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
