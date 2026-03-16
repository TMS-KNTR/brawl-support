import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
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

    // 管理者認証
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      throw new Error("管理者権限が必要です");
    }

    const { withdrawal_id, action } = await req.json();
    if (!withdrawal_id) throw new Error("withdrawal_id が必要です");
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
      // 却下：残高を戻す（楽観的ロックで競合防止）
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", withdrawal.user_id)
        .single();

      const currentBalance = profile?.balance || 0;
      const restoredBalance = currentBalance + withdrawal.amount;
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

      await supabase
        .from("withdrawals")
        .update({ status: "rejected", description: `出金却下 ¥${withdrawal.amount.toLocaleString()}` })
        .eq("id", withdrawal_id);

      // 従業員に通知
      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        type: "withdrawal_rejected",
        title: "出金申請が却下されました",
        body: `¥${withdrawal.amount.toLocaleString()} の出金申請が却下されました。残高に返還されています。`,
      }).catch(() => {});

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

    let transfer;
    try {
      transfer = await stripe.transfers.create({
        amount: withdrawal.amount,
        currency: "jpy",
        destination: empProfile.stripe_account_id,
        description: `出金承認 ¥${withdrawal.amount.toLocaleString()}`,
        metadata: { user_id: withdrawal.user_id, withdrawal_id },
      }, {
        idempotencyKey: `withdraw-${withdrawal_id}`,
      });
    } catch (stripeErr: any) {
      // Stripe送金失敗 → 残高を戻してwithdrawalをfailedに
      console.error("Stripe transfer failed, rolling back:", stripeErr.message);
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", withdrawal.user_id)
        .single();
      await supabase
        .from("profiles")
        .update({ balance: (currentProfile?.balance || 0) + withdrawal.amount })
        .eq("id", withdrawal.user_id);
      await supabase
        .from("withdrawals")
        .update({ status: "failed", description: `送金失敗: ${stripeErr.message}` })
        .eq("id", withdrawal_id);

      throw new Error(`Stripe送金に失敗しました: ${stripeErr.message}。残高は返還されています。`);
    }

    await supabase
      .from("withdrawals")
      .update({
        status: "completed",
        transfer_id: transfer.id,
        description: `出金完了 ¥${withdrawal.amount.toLocaleString()}`,
      })
      .eq("id", withdrawal_id);

    // 従業員に通知
    await supabase.from("notifications").insert({
      user_id: withdrawal.user_id,
      type: "withdrawal_completed",
      title: "出金が完了しました",
      body: `¥${withdrawal.amount.toLocaleString()} の出金が承認され、送金されました。`,
    }).catch(() => {});

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
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
