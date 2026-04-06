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

    // 管理者認証
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
    if (adminProfile?.role !== "admin") {
      throw new Error("管理者権限が必要です");
    }

    const { withdrawal_id, action } = await req.json();
    if (!withdrawal_id || typeof withdrawal_id !== "string") throw new Error("withdrawal_id が必要です");
    if (!["approve", "reject"].includes(action)) throw new Error("action は approve または reject");

    // 出金申請を取得
    const { data: withdrawal, error: wErr } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawal_id)
      .single();

    if (wErr || !withdrawal) throw new Error("出金申請が見つかりません");
    if (withdrawal.status !== "pending") throw new Error("この申請は既に処理済みです");

    if (action === "reject") {
      // 却下：残高をアトミックに戻す
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "increment_balance",
        { p_user_id: withdrawal.user_id, p_amount: withdrawal.amount }
      );

      let restoredBalance: number;

      if (rpcError && rpcError.message?.includes("function") && rpcError.message?.includes("does not exist")) {
        // RPCが存在しない場合のフォールバック: 楽観的ロック
        console.warn("increment_balance RPC not found, using optimistic lock fallback");
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", withdrawal.user_id)
          .single();

        const currentBalance = profile?.balance || 0;
        restoredBalance = currentBalance + withdrawal.amount;
        const { data: updated, error: updateError } = await supabase
          .from("profiles")
          .update({ balance: restoredBalance })
          .eq("id", withdrawal.user_id)
          .eq("balance", currentBalance)
          .select("balance")
          .single();

        if (updateError || !updated) {
          throw new Error("残高が変更されました。再度お試しください。");
        }
      } else if (rpcError) {
        throw new Error("残高の復元に失敗しました。再度お試しください。");
      } else {
        // RPC成功 - 復元後の残高を取得
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", withdrawal.user_id)
          .single();
        restoredBalance = profile?.balance || 0;
      }

      const { data: rejectedRow, error: rejectError } = await supabase
        .from("withdrawals")
        .update({ status: "rejected", description: `出金却下 ¥${withdrawal.amount.toLocaleString()}` })
        .eq("id", withdrawal_id)
        .eq("status", "pending")
        .select("id")
        .single();

      if (rejectError || !rejectedRow) {
        throw new Error("この申請は既に処理済みです");
      }

      // 従業員に通知
      try {
        await supabase.from("notifications").insert({
          user_id: withdrawal.user_id,
          type: "withdrawal_rejected",
          title: "出金申請が却下されました",
          body: `¥${withdrawal.amount.toLocaleString()} の出金申請が却下されました。残高に返還されています。`,
        });
      } catch { /* 通知失敗は無視 */ }

      return new Response(
        JSON.stringify({ success: true, message: "出金申請を却下し、残高を返還しました", new_balance: restoredBalance }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 承認：手動振込として処理（管理者が銀行振込を実行した後に承認する運用）
    const { data: empProfile } = await supabase
      .from("profiles")
      .select("bank_account_info")
      .eq("id", withdrawal.user_id)
      .single();

    if (!empProfile?.bank_account_info) {
      throw new Error("従業員の銀行口座が未登録です");
    }

    const { data: completedRow, error: completeError } = await supabase
      .from("withdrawals")
      .update({
        status: "completed",
        description: `出金完了 ¥${withdrawal.amount.toLocaleString()}（手動振込）`,
        paid_by_admin_id: user.id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", withdrawal_id)
      .eq("status", "pending")
      .select("id")
      .single();

    if (completeError || !completedRow) {
      throw new Error("この申請は既に処理済みです");
    }

    // 従業員に通知
    try {
      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        type: "withdrawal_completed",
        title: "出金が完了しました",
        body: `¥${withdrawal.amount.toLocaleString()} の出金が承認され、登録口座に振り込まれました。`,
      });
    } catch { /* 通知失敗は無視 */ }

    return new Response(
      JSON.stringify({
        success: true,
        message: `¥${withdrawal.amount.toLocaleString()} の出金を承認しました`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("approve-withdrawal error:", err.message);
    const safeMessages = [
      "認証が必要です", "アカウントが停止されています", "管理者権限が必要です",
      "withdrawal_id が必要です", "action は approve または reject",
      "出金申請が見つかりません", "この申請は既に処理済みです",
      "残高が変更されました。再度お試しください。",
      "残高の復元に失敗しました。再度お試しください。",
      "従業員の銀行口座が未登録です",
    ];
    const isSafe = safeMessages.some(m => err.message?.includes(m));
    return new Response(
      JSON.stringify({ success: false, error: isSafe ? err.message : "処理中にエラーが発生しました" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
