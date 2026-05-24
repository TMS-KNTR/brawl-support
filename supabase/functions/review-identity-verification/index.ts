import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors, requireJsonContentType } from '../_shared/cors.ts';
import { isAdmin } from '../_shared/roles.ts';

const REJECTED_REASONS = [
  "画像が不鮮明",
  "氏名が一致しない",
  "有効期限切れ",
  "裏面画像の提出はお控えください",
  "その他",
];

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const corsHeaders = getCorsHeaders(req);

  try {
    requireJsonContentType(req);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();

    if (profile?.is_banned) throw new Error("アカウントが停止されています");
    if (!isAdmin(profile?.role)) {
      return new Response(
        JSON.stringify({ success: false, error: "管理者のみ利用できます" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { verification_id, action, rejected_reason } = body;

    if (typeof verification_id !== "string" || !verification_id) {
      throw new Error("verification_id が必要です");
    }
    if (action !== "approve" && action !== "reject") {
      throw new Error("action は approve または reject を指定してください");
    }
    if (action === "reject") {
      if (typeof rejected_reason !== "string" || !REJECTED_REASONS.includes(rejected_reason)) {
        throw new Error("差戻し理由が不正です");
      }
    }

    const { data: verification, error: fetchError } = await supabase
      .from("identity_verifications")
      .select("id, employee_id, status")
      .eq("id", verification_id)
      .single();

    if (fetchError || !verification) {
      throw new Error("対象の本人確認が見つかりません");
    }
    if (verification.status !== "pending_review") {
      throw new Error("審査中の本人確認のみ操作できます");
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      const { error: updateError } = await supabase
        .from("identity_verifications")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: now,
          rejected_reason: null,
        })
        .eq("id", verification_id);

      if (updateError) {
        console.error("review-identity-verification approve error:", updateError);
        throw new Error("審査結果の保存に失敗しました");
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          identity_verification_status: "approved",
          identity_verified_at: now,
        })
        .eq("id", verification.employee_id);

      if (profileError) {
        console.error("review-identity-verification profile update error:", profileError);
      }

      await supabase.from("notifications").insert({
        user_id: verification.employee_id,
        type: "identity_verification_approved",
        title: "本人確認が承認されました",
        body: "本人確認が承認されました。これより案件の受注ができます。",
        link_url: "/dashboard/employee",
      });

      await supabase.from("admin_logs").insert({
        actor_user_id: user.id,
        action: "identity_verification_approved",
        target_type: "identity_verification",
        target_id: verification_id,
        meta_json: { employee_id: verification.employee_id },
      });

      return new Response(
        JSON.stringify({ success: true, status: "approved" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // reject
    const { error: rejectError } = await supabase
      .from("identity_verifications")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: now,
        rejected_reason,
      })
      .eq("id", verification_id);

    if (rejectError) {
      console.error("review-identity-verification reject error:", rejectError);
      throw new Error("審査結果の保存に失敗しました");
    }

    const { error: profileResetError } = await supabase
      .from("profiles")
      .update({
        identity_verification_status: "rejected",
        identity_verified_at: null,
      })
      .eq("id", verification.employee_id);

    if (profileResetError) {
      console.error("review-identity-verification profile reset error:", profileResetError);
    }

    await supabase.from("notifications").insert({
      user_id: verification.employee_id,
      type: "identity_verification_rejected",
      title: "本人確認が差戻されました",
      body: `差戻し理由: ${rejected_reason}\n再提出をお願いします。`,
      link_url: "/dashboard/employee",
    });

    await supabase.from("admin_logs").insert({
      actor_user_id: user.id,
      action: "identity_verification_rejected",
      target_type: "identity_verification",
      target_id: verification_id,
      meta_json: { employee_id: verification.employee_id, rejected_reason },
    });

    return new Response(
      JSON.stringify({ success: true, status: "rejected" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("review-identity-verification:", err.message);
    const safeMessages = [
      "認証が必要です",
      "アカウントが停止されています",
      "管理者のみ利用できます",
      "verification_id が必要です",
      "action は approve または reject を指定してください",
      "差戻し理由が不正です",
      "対象の本人確認が見つかりません",
      "審査中の本人確認のみ操作できます",
      "審査結果の保存に失敗しました",
      "Content-Type",
    ];
    const isSafe = safeMessages.some((m) => err.message?.includes(m));
    return new Response(
      JSON.stringify({ success: false, error: isSafe ? err.message : "処理中にエラーが発生しました" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
