import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

/** API呼び出しをリトライ（一時的なネットワークエラー対策） */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i < maxRetries) {
        console.warn(`[retry] API call failed, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

/** UnivaPay APIリクエスト */
async function univapayRequest(path: string, options: RequestInit = {}): Promise<any> {
  const secret = Deno.env.get("UNIVAPAY_SECRET");
  if (!secret) throw new Error("UNIVAPAY_SECRET is not configured");

  const baseUrl = "https://api.univapay.com";
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json();
  if (!res.ok) {
    console.error("UnivaPay API error:", res.status, body);
    throw new Error(body?.error?.message || `UnivaPay API error: ${res.status}`);
  }
  return body;
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

    // 管理者認証チェック
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    // 管理者チェック
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();

    if (profile?.is_banned) throw new Error("アカウントが停止されています");
    if (profile?.role !== "admin") throw new Error("管理者権限が必要です");

    // リクエストからorder_idを取得
    const { order_id } = await req.json();
    if (!order_id || typeof order_id !== "string") throw new Error("order_idが必要です");

    // 注文情報を取得
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) throw new Error("注文が見つかりません");
    if (order.status === "cancelled") throw new Error("既にキャンセル済みです");
    if (order.is_refunded) throw new Error("既に返金済みです");

    // UnivaPay で返金
    let refundResult = null;
    const storeId = Deno.env.get("UNIVAPAY_STORE_ID");
    const chargeId = order.univapay_charge_id;

    if (!chargeId) {
      throw new Error("決済情報が見つかりません。UnivaPay管理画面から手動で返金してください。");
    }
    if (!storeId) {
      throw new Error("UNIVAPAY_STORE_IDが設定されていません");
    }

    refundResult = await withRetry(() => univapayRequest(
      `/stores/${storeId}/charges/${chargeId}/refunds`,
      {
        method: "POST",
        body: JSON.stringify({
          amount: order.price,
          currency: "jpy",
          reason: "customer_request",
          message: `管理者による返金 (order: ${order_id})`,
          metadata: { order_id },
        }),
      }
    ));

    console.log("UnivaPay refund created:", refundResult.id);

    // 注文ステータスを更新（楽観的ロックで二重返金を防止）
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        is_refunded: true,
        refund_id: refundResult?.id || null,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .eq("is_refunded", false)
      .select("id")
      .single();

    if (!updatedOrder) {
      console.warn("Order already marked as refunded:", order_id);
    }

    if (updateError) {
      console.error("DB update failed:", updateError);
      throw new Error("返金は成功しましたが、DB更新に失敗しました。手動で確認してください。");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "返金が完了しました",
        refund_id: refundResult?.id,
        amount: order.price,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Refund error:", err.message);
    const safeMessages = [
      "認証が必要です", "アカウントが停止されています", "管理者権限が必要です",
      "order_idが必要です", "注文が見つかりません", "既にキャンセル済みです",
      "既に返金済みです", "決済情報が見つかりません", "UNIVAPAY_STORE_IDが設定されていません",
      "返金は成功しましたが、DB更新に失敗しました",
    ];
    const isSafe = safeMessages.some(m => err.message?.includes(m));
    return new Response(
      JSON.stringify({ success: false, error: isSafe ? err.message : "返金処理中にエラーが発生しました" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
