import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCors, requireJsonContentType } from '../_shared/cors.ts'
import { isEmployeeOrAdmin } from '../_shared/roles.ts'

serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

  try {
    requireJsonContentType(req)

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 従業員認証
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, balance, bank_account_info")
      .eq("id", user.id)
      .single();

    if (!isEmployeeOrAdmin(profile?.role)) {
      throw new Error("従業員権限が必要です");
    }

    // 未処理の出金申請数をチェック（レートリミット）
    const { count: pendingCount } = await supabase
      .from("withdrawals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");

    if ((pendingCount ?? 0) >= 3) {
      throw new Error("未処理の出金申請が多すぎます。承認後に再度お試しください。");
    }

    const MIN_WITHDRAW = 300;
    const { amount: rawAmount } = await req.json();
    const amount = Math.floor(Number(rawAmount));
    if (isNaN(amount) || amount <= 0) throw new Error("出金額を指定してください");
    if (amount < MIN_WITHDRAW) throw new Error(`最低出金額は¥${MIN_WITHDRAW.toLocaleString()}です`);

    const currentBalance = profile?.balance || 0;
    if (amount > currentBalance) throw new Error(`残高不足です（残高: ¥${currentBalance.toLocaleString()}）`);

    if (!profile?.bank_account_info) {
      throw new Error("銀行口座が未登録です。先に口座登録を行ってください。");
    }

    // 残高を仮押さえ（減らす）— 楽観的ロックで競合を防止
    const newBalance = currentBalance - amount;
    if (newBalance < 0) throw new Error("残高不足です");
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user.id)
      .eq("balance", currentBalance)
      .select("balance")
      .single();

    if (updateError || !updated) {
      throw new Error("残高が変更されました。再度お試しください。");
    }

    // 出金申請を pending で記録（管理者の承認待ち）
    const { error: insertError } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: amount,
      type: "withdrawal",
      status: "pending",
      description: `出金申請 ¥${amount.toLocaleString()}`,
    });

    if (insertError) {
      // 出金レコード作成失敗 → 残高を戻す
      await supabase
        .from("profiles")
        .update({ balance: currentBalance })
        .eq("id", user.id)
        .eq("balance", newBalance);
      throw new Error("出金申請の記録に失敗しました。再度お試しください。");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `¥${amount.toLocaleString()} の出金申請を送信しました。管理者の承認後に振り込まれます。`,
        new_balance: newBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Withdraw error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
