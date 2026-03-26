import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

const ALLOWED_EMAIL_TYPES = [
  "chat_message",
  "order_assigned",
  "order_in_progress",
  "order_completed",
  "order_confirmed",
  "admin_broadcast",
];

const RESEND_API = "https://api.resend.com/emails";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedSecret = Deno.env.get("INTERNAL_NOTIFICATION_SECRET");
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    let user_id: string;
    let type: string;
    let title: string;
    let bodyText: string | null = null;
    let link_url: string | null = null;

    if (body.notification_id && token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ success: false, error: "認証が必要です" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      // 管理者かチェック
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const isAdmin = profile?.role === "admin";

      const { data: notif, error: notifErr } = await supabase
        .from("notifications")
        .select("id, user_id, type, title, body, link_url, email_sent_at, created_at")
        .eq("id", body.notification_id)
        .single();

      if (notifErr || !notif) {
        return new Response(JSON.stringify({ success: true, skipped: "notification not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      // 管理者からの再送は送信済み・時間制限をスキップ
      if (!isAdmin) {
        if (notif.email_sent_at) {
          return new Response(JSON.stringify({ success: true, skipped: "already sent" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        const createdAt = new Date(notif.created_at).getTime();
        if (notif.type !== "admin_broadcast" && Date.now() - createdAt > 2 * 60 * 1000) {
          return new Response(JSON.stringify({ success: true, skipped: "too old" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
      user_id = notif.user_id;
      type = notif.type;
      title = notif.title;
      bodyText = notif.body ?? null;
      link_url = notif.link_url ?? null;
    } else if (body.user_id && body.type && body.title && expectedSecret && internalSecret && timingSafeEqual(internalSecret, expectedSecret)) {
      user_id = body.user_id;
      type = body.type;
      title = body.title;
      bodyText = body.body ?? null;
      link_url = body.link_url ?? null;
      if (!ALLOWED_EMAIL_TYPES.includes(type)) {
        return new Response(JSON.stringify({ success: true, skipped: "type not allowed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      return new Response(JSON.stringify({ success: false, error: "invalid request" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
    const toEmail = authUser?.user?.email;
    if (!toEmail) {
      return new Response(JSON.stringify({ success: true, skipped: "no email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL") || "Gemsuke <onboarding@resend.dev>";

    if (!resendKey) {
      console.error("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ success: false, error: "email not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const appUrl = Deno.env.get("APP_URL") || "https://your-app.com";
    const fullUrl = link_url ? (link_url.startsWith("http") ? link_url : `${appUrl}${link_url}`) : appUrl;

    // HTMLエスケープ（XSS防止）
    function escapeHtml(s: string): string {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    // link_urlのjavascript:プロトコル排除
    const safeUrl = /^https?:\/\//.test(fullUrl) ? fullUrl : appUrl;

    const html = `
      <p>${bodyText ? escapeHtml(bodyText).replace(/\n/g, "<br>") : ""}</p>
      ${link_url ? `<p><a href="${escapeHtml(safeUrl)}">アプリで確認する</a></p>` : ""}
      <p style="color:#888;font-size:12px;">このメールは Gemsuke からの自動通知です。</p>
    `;

    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "User-Agent": "BrawlSupport-Edge/1.0",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: title,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", res.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: "email send failed", detail: errText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (body.notification_id) {
      await supabase
        .from("notifications")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", body.notification_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("send-notification-email:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
