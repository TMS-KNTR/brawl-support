import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

// 依頼者が完了確認 → ステータス更新 + 従業員の残高に報酬を加算
serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

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
    const customerId = order.user_id;
    if (customerId !== user.id) throw new Error("この注文の依頼者ではありません");

    // completedステータスのみ確認可能
    if (order.status !== "completed") throw new Error("この注文はまだ完了していません");

    // 既に確認済み
    if (order.is_paid_out) throw new Error("既に確認・支払い済みです");

    const employeeId = order.employee_id;
    if (!employeeId) throw new Error("従業員が割り当てられていません");

    // 注文作成時に保存された報酬額を使用（手数料率変更の影響を受けない）
    const payoutAmount = order.payout_amount;

    if (!payoutAmount || payoutAmount <= 0) {
      throw new Error("報酬金額が0以下です");
    }

    // --- 先に注文ステータスを confirmed に更新（楽観的ロックで二重実行を防止） ---
    const { data: orderUpdated, error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        is_paid_out: true,
      })
      .eq("id", order_id)
      .eq("is_paid_out", false)  // 楽観的ロック: まだ未払いの場合のみ
      .eq("status", "completed") // ステータスが変わっていないことを確認
      .select("id")
      .single();

    if (orderUpdateError || !orderUpdated) {
      throw new Error("既に処理済みか、注文の状態が変更されました。");
    }

    // --- 従業員の残高を加算 ---
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

    if (balanceError || !balanceUpdated) {
      // 残高更新失敗 → 注文ステータスを戻す
      await supabase
        .from("orders")
        .update({ status: "completed", is_paid_out: false })
        .eq("id", order_id);
      throw new Error("残高が変更されました。再度お試しください。");
    }

    // 出金履歴に記録
    await supabase.from("withdrawals").insert({
      user_id: employeeId,
      amount: payoutAmount,
      type: "earning",
      status: "completed",
      description: `注文 ${order_id.slice(0, 8)}... の報酬`,
      order_id: order_id,
    });

    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: employeeId,
      type: "order_confirmed",
      title: "依頼者が完了を確認しました",
      body: `報酬 ¥${payoutAmount.toLocaleString()} が残高に反映されました。`,
      link_url: "/dashboard/employee",
    });
    if (notifError) console.error("通知挿入失敗:", notifError.message);

    const secret = Deno.env.get("INTERNAL_NOTIFICATION_SECRET");
    const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification-email`;
    if (secret) {
      try {
        await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": secret,
          },
          body: JSON.stringify({
            user_id: employeeId,
            type: "order_confirmed",
            title: "依頼者が完了を確認しました",
            body: `報酬 ¥${payoutAmount.toLocaleString()} が残高に反映されました。`,
            link_url: "/dashboard/employee",
          }),
        });
      } catch (e) {
        console.error("send-notification-email:", e);
      }
    } else {
      console.warn("INTERNAL_NOTIFICATION_SECRET未設定のためメール通知をスキップ");
    }

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
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
