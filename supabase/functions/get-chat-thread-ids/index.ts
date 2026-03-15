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

    const body = await req.json().catch(() => ({}));
    const orderIds = body?.order_ids ?? body?.orderIds;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: {} }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { data: threads, error } = await supabase
      .from("chat_threads")
      .select("id, order_id")
      .in("order_id", orderIds);

    if (error) {
      console.error("get-chat-thread-ids error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const map: Record<string, string> = {};
    for (const t of threads ?? []) {
      if (t.order_id && t.id) map[t.order_id] = t.id;
    }

    // スレッドが無い注文のうち、依頼者（user_id = 自分）のものはスレッドを自動作成
    const missingOrderIds = orderIds.filter((id: string) => !map[id]);
    const uid = String((user as any).id ?? "").toLowerCase();
    if (missingOrderIds.length > 0) {
      const { data: orders, error: ordersErr } = await supabase
        .from("orders")
        .select("id, user_id")
        .in("id", missingOrderIds);
      if (ordersErr) {
        console.error("orders fetch error:", ordersErr);
      } else {
        for (const order of orders ?? []) {
          const orderUid = String(order.user_id ?? "").toLowerCase();
          if (orderUid !== uid) continue; // 依頼者本人の注文のみ
          const participants = [order.user_id].filter(Boolean);
          if (participants.length === 0) continue;
          // participants が text/jsonb どちらでも動くよう配列と文字列の両方試す
          let newThread: { id?: string } | null = null;
          let insertErr: any = null;
          const { data: d1, error: e1 } = await supabase
            .from("chat_threads")
            .insert({ order_id: order.id, participants })
            .select("id")
            .single();
          if (e1) {
            insertErr = e1;
            const { data: d2, error: e2 } = await supabase
              .from("chat_threads")
              .insert({ order_id: order.id, participants: JSON.stringify(participants) })
              .select("id")
              .single();
            if (!e2 && d2) {
              newThread = d2;
            }
          } else {
            newThread = d1;
          }
          if (insertErr && !newThread) {
            console.error("chat_threads insert error for order", order.id, insertErr);
            continue;
          }
          if (newThread?.id) map[order.id] = newThread.id;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: map }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("get-chat-thread-ids:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
