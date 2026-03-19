import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

// 従業員が案件を受注する。サービスロールで orders を更新するため RLS の影響を受けない
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
      .select("role, is_banned")
      .eq("id", user.id)
      .single();

    if (profile?.is_banned) {
      throw new Error("アカウントが停止されています");
    }

    // メンテナンスモードチェック
    const { data: maintenanceSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single();
    if (maintenanceSetting?.value === true || maintenanceSetting?.value === 'true') {
      return new Response(
        JSON.stringify({ success: false, error: "現在メンテナンス中のため、受注できません" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

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
      .in("status", ["paid", "open", "pending"])
      .select();

    if (updateError) {
      console.error("accept-order update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!updated || updated.length === 0) {
      throw new Error("この注文は既に他の代行者が受注しました");
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
      // スレッドが無い場合は受注時に新規作成（新規受注でチャットボタンが出るようにする）
      const { data: orderRow } = await supabase
        .from("orders")
        .select("user_id")
        .eq("id", orderId)
        .single();

      const customerId = orderRow?.user_id;
      const participants = [customerId, user.id].filter(Boolean);
      if (participants.length > 0) {
        await supabase
          .from("chat_threads")
          .insert({ order_id: orderId, participants });
      }
    }

    const { data: orderRow } = await supabase
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();
    const customerId = orderRow?.user_id;
    if (customerId) {
      const { data: chatThread } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();
      const linkUrl = chatThread?.id ? `/chat/${chatThread.id}` : null;
      await supabase.from("notifications").insert({
        user_id: customerId,
        type: "order_assigned",
        title: "依頼が受注されました",
        body: "代行者が依頼を受注しました。チャットでやり取りできます。",
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
              type: "order_assigned",
              title: "依頼が受注されました",
              body: "代行者が依頼を受注しました。チャットでやり取りできます。",
              link_url: linkUrl,
            }),
          });
        } catch (e) {
          console.error("send-notification-email:", e);
        }
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
