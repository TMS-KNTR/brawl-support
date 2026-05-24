-- ============================================================
-- 代行者本人確認 機能追加
-- 関連: docs/IDENTITY_VERIFICATION_REQUIREMENTS.md
-- ============================================================

-- 1. identity_verifications テーブル
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('drivers_license', 'mynumber_card', 'passport', 'residence_card')),
  document_images jsonb NOT NULL,
  full_name_kana text NOT NULL,
  full_name_kanji text NOT NULL,
  date_of_birth date NOT NULL,
  address text NOT NULL,
  agreement_accepted_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  rejected_reason text,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_employee
  ON public.identity_verifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_pending
  ON public.identity_verifications(status) WHERE status = 'pending_review';

-- updated_at 自動更新
CREATE OR REPLACE FUNCTION public.touch_identity_verifications_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_identity_verifications_updated_at
  ON public.identity_verifications;
CREATE TRIGGER trg_identity_verifications_updated_at
  BEFORE UPDATE ON public.identity_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_identity_verifications_updated_at();

-- RLS: 読み取りのみ。書き込みは Edge Function (service_role) 経由のみ
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "identity_verifications_select_own"
  ON public.identity_verifications FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "identity_verifications_select_admin"
  ON public.identity_verifications FOR SELECT TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE public.identity_verifications IS '代行者本人確認の提出履歴';

-- 2. profiles テーブルに本人確認ステータス列追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_verification_status text NOT NULL DEFAULT 'unsubmitted'
    CHECK (identity_verification_status IN ('unsubmitted', 'pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz;

COMMENT ON COLUMN public.profiles.identity_verification_status IS '本人確認ステータス (unsubmitted/pending_review/approved/rejected)';
COMMENT ON COLUMN public.profiles.identity_verified_at IS '本人確認承認日時';

-- 3. profiles.identity_verification_status を一般ユーザー変更不可に
--    既存トリガー prevent_self_privilege_escalation に列を追加
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (Edge Functions) は制限しない
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 管理者は制限しない
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- 一般ユーザーによる機密列の変更をブロック
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'ロールの変更は管理者のみ可能です';
  END IF;
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    RAISE EXCEPTION 'BAN状態の変更は管理者のみ可能です';
  END IF;
  IF NEW.ban_reason IS DISTINCT FROM OLD.ban_reason THEN
    RAISE EXCEPTION 'BAN理由の変更は管理者のみ可能です';
  END IF;
  IF NEW.banned_at IS DISTINCT FROM OLD.banned_at THEN
    RAISE EXCEPTION 'BAN日時の変更は管理者のみ可能です';
  END IF;
  IF NEW.balance IS DISTINCT FROM OLD.balance THEN
    RAISE EXCEPTION '残高の変更は管理者のみ可能です';
  END IF;
  IF NEW.warning_count IS DISTINCT FROM OLD.warning_count THEN
    RAISE EXCEPTION '警告回数の変更は管理者のみ可能です';
  END IF;
  IF NEW.identity_verification_status IS DISTINCT FROM OLD.identity_verification_status THEN
    RAISE EXCEPTION '本人確認ステータスの変更は管理者のみ可能です';
  END IF;
  IF NEW.identity_verified_at IS DISTINCT FROM OLD.identity_verified_at THEN
    RAISE EXCEPTION '本人確認日時の変更は管理者のみ可能です';
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Storage バケット identity-documents 作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', false)
ON CONFLICT (id) DO NOTHING;

-- SELECT: admin のみ（本人すら直接参照不可、再ダウンロードは新規再提出）
CREATE POLICY "identity_documents_select_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'identity-documents'
    AND public.is_admin()
  );

-- INSERT: 本人のみ自分のフォルダ（パス先頭が employee_id）へアップロード可能
CREATE POLICY "identity_documents_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'identity-documents'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  );

-- DELETE: admin のみ（保管期間切れ・差戻し後の削除運用）
CREATE POLICY "identity_documents_delete_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'identity-documents'
    AND public.is_admin()
  );
