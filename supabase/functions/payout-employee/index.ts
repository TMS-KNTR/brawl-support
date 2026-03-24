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
    if (order.status !== "completed") throw new Error("完了済みの注文のみ支払い可能です（現在: " + order.status + "）");

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
    // 注文時に保存されたpayout_amountを優先使用（手数料率変更の影響を受けない）
    const payoutAmount = order.payout_amount || (totalPrice - (order.platform_fee || Math.round(totalPrice * feeRate)));
    const platformFee = totalPrice - payoutAmount;
    if (payoutAmount <= 0) throw new Error("支払い金額が0以下です");

    // 従業員の残高を加算（楽観ロック + リトライ）
    let newBalance = 0;
    let balanceUpdated = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: empProfile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", employeeId)
        .single();

      const currentBalance = empProfile?.balance || 0;
      newBalance = currentBalance + payoutAmount;

      const { data: updated, error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", employeeId)
        .eq("balance", currentBalance)
        .select("balance")
        .single();

      if (updated && !balanceError) {
        balanceUpdated = true;
        break;
      }
      if (attempt < 2) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
    if (!balanceUpdated) throw new Error("残高の更新に失敗しました。再度お試しください。");

    // 注文を確認済みに更新（楽観ロックで二重支払い防止）
    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        is_paid_out: true,
        payout_amount: payoutAmount,
        paid_out_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .eq("is_paid_out", false)
      .select("id")
      .single();

    if (orderUpdateError || !updatedOrder) {
      // 残高を戻す
      await supabase
        .from("profiles")
        .update({ balance: newBalance - payoutAmount })
        .eq("id", employeeId);
      throw new Error("注文の更新に失敗しました（既に処理済みの可能性があります）");
    }

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
    const safeMessages = [
      "認証が必要です", "アカウントが停止されています", "管理者権限が必要です",
      "order_idが必要です", "注文が見つかりません", "既に支払い済みです",
      "従業員が割り当てられていません", "支払い金額が0以下です",
      "残高の更新に失敗しました。再度お試しください。",
      "注文の更新に失敗しました（既に処理済みの可能性があります）",
    ];
    const isSafe = safeMessages.some(m => err.message?.includes(m)) ||
      err.message?.startsWith("完了済みの注文のみ");
    return new Response(
      JSON.stringify({ success: false, error: isSafe ? err.message : "処理中にエラーが発生しました" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
