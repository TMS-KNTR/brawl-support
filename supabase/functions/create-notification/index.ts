import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

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
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "認証が必要です" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "認証が必要です" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json().catch(() => ({}));
    const { user_id, type, title, body: bodyText, link_url } = body;
    if (!user_id || !type || !title) {
      return new Response(JSON.stringify({ success: false, error: "user_id, type, title は必須です" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 通知タイプのホワイトリスト
    const ALLOWED_TYPES = [
      "chat_message",
      "ng_word_violation",
    ];

    // 管理者は制限なし。一般ユーザーは許可されたタイプのみ送信可能
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = senderProfile?.role === "admin";

    if (!isAdmin) {
      // 許可されたタイプ以外は拒否
      if (!ALLOWED_TYPES.includes(type)) {
        return new Response(JSON.stringify({ success: false, error: "許可されていない通知タイプです" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }

      // チャット通知の場合: 送信者が対象注文の参加者であることを確認
      if (type === "chat_message" && link_url) {
        const threadIdMatch = link_url.match(/\/chat\/([^/]+)/);
        if (threadIdMatch) {
          const { data: thread } = await supabase
            .from("chat_threads")
            .select("order:orders(user_id, employee_id)")
            .eq("id", threadIdMatch[1])
            .single();
          const order = (thread as any)?.order;
          if (!order || (order.user_id !== user.id && order.employee_id !== user.id)) {
            return new Response(JSON.stringify({ success: false, error: "このチャットへのアクセス権がありません" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 403,
            });
          }
        }
      }
    }

    const { data: row, error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        type,
        title,
        body: bodyText ?? null,
        link_url: link_url ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("create-notification insert error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ success: true, id: row?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("create-notification:", err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
