import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors, requireJsonContentType } from '../_shared/cors.ts';
import { isEmployeeOrAdmin } from '../_shared/roles.ts';

const DOCUMENT_TYPES = ['drivers_license', 'mynumber_card', 'passport', 'residence_card'];
const MAX_IMAGE_PATHS = 4;
const MAX_TEXT_LENGTH = 200;

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
      .select("role, is_banned, identity_verification_status")
      .eq("id", user.id)
      .single();

    if (profile?.is_banned) throw new Error("アカウントが停止されています");
    if (!isEmployeeOrAdmin(profile?.role)) {
      return new Response(
        JSON.stringify({ success: false, error: "代行者または管理者のみ利用できます" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    if (profile?.identity_verification_status === "pending_review") {
      throw new Error("審査中の本人確認があります");
    }
    if (profile?.identity_verification_status === "approved") {
      throw new Error("既に本人確認が完了しています");
    }

    const body = await req.json().catch(() => ({}));
    const {
      document_type,
      document_image_paths,
      full_name_kana,
      full_name_kanji,
      date_of_birth,
      address,
      agreement_accepted,
    } = body;

    if (!DOCUMENT_TYPES.includes(document_type)) {
      throw new Error("身分証の種類が不正です");
    }
    if (!Array.isArray(document_image_paths) || document_image_paths.length === 0 || document_image_paths.length > MAX_IMAGE_PATHS) {
      throw new Error("身分証画像のアップロードが必要です");
    }
    for (const p of document_image_paths) {
      if (typeof p !== "string" || !p.startsWith(`${user.id}/`)) {
        throw new Error("身分証画像のパスが不正です");
      }
    }
    if (typeof full_name_kana !== "string" || !full_name_kana.trim() || full_name_kana.length > MAX_TEXT_LENGTH) {
      throw new Error("必須項目が入力されていません");
    }
    if (typeof full_name_kanji !== "string" || !full_name_kanji.trim() || full_name_kanji.length > MAX_TEXT_LENGTH) {
      throw new Error("必須項目が入力されていません");
    }
    if (typeof date_of_birth !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
      throw new Error("生年月日が不正です");
    }
    if (typeof address !== "string" || !address.trim() || address.length > MAX_TEXT_LENGTH) {
      throw new Error("必須項目が入力されていません");
    }
    if (agreement_accepted !== true) {
      throw new Error("業務委託契約への同意が必要です");
    }

    const { data: inserted, error: insertError } = await supabase
      .from("identity_verifications")
      .insert({
        employee_id: user.id,
        document_type,
        document_images: document_image_paths,
        full_name_kana: full_name_kana.trim(),
        full_name_kanji: full_name_kanji.trim(),
        date_of_birth,
        address: address.trim(),
        status: "pending_review",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("submit-identity-verification insert error:", insertError);
      throw new Error("提出に失敗しました");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ identity_verification_status: "pending_review" })
      .eq("id", user.id);

    if (profileError) {
      console.error("submit-identity-verification profile update error:", profileError);
    }

    // 管理者全員に通知
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const notifications = admins.map((a: { id: string }) => ({
        user_id: a.id,
        type: "identity_verification_submitted",
        title: "本人確認の提出がありました",
        body: "代行者から本人確認の提出があり、審査をお願いします。",
        link_url: "/dashboard/admin/identity-verifications",
      }));
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ success: true, verification_id: inserted?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("submit-identity-verification:", err.message);
    const safeMessages = [
      "認証が必要です",
      "アカウントが停止されています",
      "代行者または管理者のみ利用できます",
      "審査中の本人確認があります",
      "既に本人確認が完了しています",
      "身分証の種類が不正です",
      "身分証画像のアップロードが必要です",
      "身分証画像のパスが不正です",
      "必須項目が入力されていません",
      "生年月日が不正です",
      "業務委託契約への同意が必要です",
      "提出に失敗しました",
      "Content-Type",
    ];
    const isSafe = safeMessages.some((m) => err.message?.includes(m));
    return new Response(
      JSON.stringify({ success: false, error: isSafe ? err.message : "処理中にエラーが発生しました" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
