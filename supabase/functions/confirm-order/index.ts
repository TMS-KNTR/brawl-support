import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 依頼者が完了確認 → ステータス更新 + 従業員の残高に報酬を加算
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 依頼者認証
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_idが必要です");

    // 注文取得
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) throw new Error("注文が見つかりません");

    // 依頼者本人かチェック
    const customerId = order.user_id || order.customer_id;
    if (customerId !== user.id) throw new Error("この注文の依頼者ではありません");

    // completedステータスのみ確認可能
    if (order.status !== "completed") throw new Error("この注文はまだ完了していません");

    // 既に確認済み
    if (order.is_paid_out) throw new Error("既に確認・支払い済みです");

    const employeeId = order.employee_id;
    if (!employeeId) throw new Error("従業員が割り当てられていません");

    // 報酬計算（75%が従業員）
    const totalPrice = order.price || order.total_price || 0;
    const platformFee = order.platform_fee || Math.round(totalPrice * 0.25);
    const payoutAmount = totalPrice - platformFee;

    if (payoutAmount <= 0) throw new Error("報酬金額が0以下です");

    // 従業員の残高を加算
    const { data: empProfile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", employeeId)
      .single();

    const currentBalance = empProfile?.balance || 0;
    const newBalance = currentBalance + payoutAmount;

    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", employeeId);

    if (balanceError) throw new Error("残高更新に失敗: " + balanceError.message);

    // 注文ステータスを confirmed + 支払い済みに更新
    await supabase
      .from("orders")
      .update({
        status: "confirmed",
        is_paid_out: true,
        payout_amount: payoutAmount,
        paid_out_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    // 出金履歴に記録
    await supabase.from("withdrawals").insert({
      user_id: employeeId,
      amount: payoutAmount,
      type: "earning",
      status: "completed",
      description: `注文 ${order_id.slice(0, 8)}... の報酬`,
      order_id: order_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "完了を確認しました",
        payout_amount: payoutAmount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Confirm order error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
