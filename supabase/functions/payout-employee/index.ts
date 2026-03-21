import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

// 完了時: 従業員の残高に加算するだけ（Stripe送金はしない）
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

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();
    if (adminProfile?.is_banned) throw new Error("アカウントが停止されています");
    if (adminProfile?.role !== "admin") throw new Error("管理者権限が必要です");

    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_idが必要です");

    // 注文取得
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();
    if (orderError || !order) throw new Error("注文が見つかりません");
    if (order.is_paid_out) throw new Error("既に支払い済みです");

    const employeeId = order.employee_id;
    if (!employeeId) throw new Error("従業員が割り当てられていません");

    // system_settings から手数料率を取得
    const { data: feeRateSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "platform_fee_rate")
      .single();
    const feeRate = Number(feeRateSetting?.value) || 0.20;

    const totalPrice = order.price || order.total_price || 0;
    const platformFee = order.platform_fee || Math.round(totalPrice * feeRate);
    const payoutAmount = totalPrice - platformFee;
    if (payoutAmount <= 0) throw new Error("支払い金額が0以下です");

    // 従業員の残高を加算
    const { data: empProfile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", employeeId)
      .single();

    const currentBalance = empProfile?.balance || 0;
    const newBalance = currentBalance + payoutAmount;

    const { data: balanceUpdated, error: balanceError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", employeeId)
      .eq("balance", currentBalance)
      .select("balance")
      .single();

    if (balanceError || !balanceUpdated) throw new Error("残高が変更されました。再度お試しください。");

    // 注文を確認済みに更新
    await supabase
      .from("orders")
      .update({
        status: "confirmed",
        is_paid_out: true,
        payout_amount: payoutAmount,
        paid_out_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    // 出金履歴に記録（type: 'earning'）
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
        message: `¥${payoutAmount.toLocaleString()} を従業員の残高に追加しました`,
        payout_amount: payoutAmount,
        platform_fee: platformFee,
        new_balance: newBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Payout error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
