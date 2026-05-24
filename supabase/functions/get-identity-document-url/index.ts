import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors, requireJsonContentType } from '../_shared/cors.ts';
import { isAdmin } from '../_shared/roles.ts';

const SIGNED_URL_EXPIRES_SEC = 300; // 5分

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
    const { verification_id, document_index } = body;

    if (typeof verification_id !== "string" || !verification_id) {
      throw new Error("verification_id が必要です");
    }
    const idx = Number(document_index);
    if (!Number.isInteger(idx) || idx < 0) {
      throw new Error("document_index が不正です");
    }

    const { data: verification, error: fetchError } = await supabase
      .from("identity_verifications")
      .select("id, employee_id, document_images")
      .eq("id", verification_id)
      .single();

    if (fetchError || !verification) {
      throw new Error("対象の本人確認が見つかりません");
    }

    const images = verification.document_images;
    if (!Array.isArray(images) || idx >= images.length) {
      throw new Error("指定された画像が存在しません");
    }
    const path = images[idx];
    if (typeof path !== "string") {
      throw new Error("画像パスが不正です");
    }

    const { data: signed, error: signError } = await supabase
      .storage
      .from("identity-documents")
      .createSignedUrl(path, SIGNED_URL_EXPIRES_SEC);

    if (signError || !signed?.signedUrl) {
      console.error("get-identity-document-url sign error:", signError);
      throw new Error("画像URLの発行に失敗しました");
    }

    // アクセスログ
    await supabase.from("admin_logs").insert({
      actor_user_id: user.id,
      action: "identity_document_viewed",
      target_type: "identity_verification",
      target_id: verification_id,
      meta_json: { employee_id: verification.employee_id, document_index: idx, path },
    });

    return new Response(
      JSON.stringify({ success: true, signed_url: signed.signedUrl, expires_in: SIGNED_URL_EXPIRES_SEC }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("get-identity-document-url:", err.message);
    const safeMessages = [
      "認証が必要です",
      "アカウントが停止されています",
      "管理者のみ利用できます",
      "verification_id が必要です",
      "document_index が不正です",
      "対象の本人確認が見つかりません",
      "指定された画像が存在しません",
      "画像パスが不正です",
      "画像URLの発行に失敗しました",
      "Content-Type",
    ];
    const isSafe = safeMessages.some((m) => err.message?.includes(m));
    return new Response(
      JSON.stringify({ success: false, error: isSafe ? err.message : "処理中にエラーが発生しました" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
