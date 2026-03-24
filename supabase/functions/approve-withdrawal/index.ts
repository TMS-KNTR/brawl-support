import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

/** Stripe API呼び出しをリトライ */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable = err.type === "StripeConnectionError" || err.type === "StripeAPIError" || err.code === "ECONNRESET";
      if (i < maxRetries && isRetryable) {
        console.warn(`[retry] Stripe API failed, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
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

    // 承認：Stripe Transferで送金
    const { data: empProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", withdrawal.user_id)
      .single();

    if (!empProfile?.stripe_account_id) {
      throw new Error("従業員の銀行口座が未登録です");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Stripeアカウントの状態を確認（送金可能か）
    const account = await withRetry(() => stripe.accounts.retrieve(empProfile.stripe_account_id));
    if (!account.payouts_enabled) {
      throw new Error("従業員のStripeアカウントが送金可能な状態ではありません（審査中または未完了）");
    }

    let transfer;
    try {
      transfer = await withRetry(() => stripe.transfers.create({
        amount: withdrawal.amount,
        currency: "jpy",
        destination: empProfile.stripe_account_id,
        description: `出金承認 ¥${withdrawal.amount.toLocaleString()}`,
        metadata: { user_id: withdrawal.user_id, withdrawal_id },
      }, {
        idempotencyKey: `withdraw-${withdrawal_id}`,
      }));
    } catch (stripeErr: any) {
      // Stripe送金失敗 → 残高を戻してwithdrawalをfailedに
      console.error("Stripe transfer failed, rolling back:", stripeErr.message);
      // アトミックに残高を戻す
      let rollbackSuccess = false;
      const { error: rollbackRpcErr } = await supabase.rpc(
        "increment_balance",
        { p_user_id: withdrawal.user_id, p_amount: withdrawal.amount }
      );

      if (rollbackRpcErr && rollbackRpcErr.message?.includes("function") && rollbackRpcErr.message?.includes("does not exist")) {
        // RPCが存在しない場合のフォールバック: 楽観的ロック（リトライ付き）
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data: currentProfile } = await supabase
            .from("profiles")
            .select("balance")
            .eq("id", withdrawal.user_id)
            .single();
          const curBal = currentProfile?.balance || 0;
          const { data: rollbackOk, error: rollbackErr } = await supabase
            .from("profiles")
            .update({ balance: curBal + withdrawal.amount })
            .eq("id", withdrawal.user_id)
            .eq("balance", curBal)
            .select("balance")
            .single();
          if (rollbackOk && !rollbackErr) {
            rollbackSuccess = true;
            break;
          }
          if (attempt < 2) await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
      } else if (!rollbackRpcErr) {
        rollbackSuccess = true;
      }

      if (rollbackSuccess) {
        await supabase
          .from("withdrawals")
          .update({ status: "failed", description: `送金失敗: ${stripeErr.message}` })
          .eq("id", withdrawal_id);
        throw new Error(`Stripe送金に失敗しました: ${stripeErr.message}。残高は返還されています。`);
      } else {
        console.error("CRITICAL: 残高ロールバック失敗 - 手動対応が必要:", withdrawal.user_id, withdrawal_id);
        // ロールバック失敗を明示的に記録して管理者に手動対応を促す
        await supabase
          .from("withdrawals")
          .update({
            status: "rollback_failed",
            description: `CRITICAL: Stripe送金失敗 + 残高ロールバック失敗。手動で残高 ¥${withdrawal.amount.toLocaleString()} を復元してください。エラー: ${stripeErr.message}`,
          })
          .eq("id", withdrawal_id);

        // 管理者に緊急通知
        try {
          const { data: admins } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "admin");
          for (const admin of admins || []) {
            await supabase.from("notifications").insert({
              user_id: admin.id,
              type: "system_alert",
              title: "【緊急】残高ロールバック失敗",
              body: `出金ID: ${withdrawal_id} / ユーザー: ${withdrawal.user_id} / 金額: ¥${withdrawal.amount.toLocaleString()} の残高復元に失敗しました。手動対応が必要です。`,
            });
          }
        } catch { /* 通知失敗は無視 */ }

        throw new Error(`Stripe送金に失敗し、残高の自動復元にも失敗しました。管理者に通知済みです。`);
      }
    }

    const { data: completedRow, error: completeError } = await supabase
      .from("withdrawals")
      .update({
        status: "completed",
        transfer_id: transfer.id,
        description: `出金完了 ¥${withdrawal.amount.toLocaleString()}`,
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
        body: `¥${withdrawal.amount.toLocaleString()} の出金が承認され、送金されました。`,
      });
    } catch { /* 通知失敗は無視 */ }

    return new Response(
      JSON.stringify({
        success: true,
        message: `¥${withdrawal.amount.toLocaleString()} の出金を承認・送金しました`,
        transfer_id: transfer.id,
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
      "従業員のStripeアカウントが送金可能な状態ではありません",
    ];
    const isSafe = safeMessages.some(m => err.message?.includes(m));
    return new Response(
      JSON.stringify({ success: false, error: isSafe ? err.message : "処理中にエラーが発生しました" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
