-- =============================================
-- Storage ポリシーの無限再帰を修正
-- orders テーブルの RLS が再帰的に評価されるため、
-- SECURITY DEFINER 関数で RLS をバイパスして参加者チェックを行う
-- =============================================

-- 注文の参加者かどうかを RLS をバイパスして確認する関数
CREATE OR REPLACE FUNCTION public.is_order_participant(p_order_id text, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id::text = p_order_id
      AND (o.user_id = p_user_id OR o.employee_id = p_user_id)
  );
$$;

-- チャット参加者かどうかを RLS をバイパスして確認する関数
CREATE OR REPLACE FUNCTION public.is_chat_attachment_allowed(p_order_id text, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_threads ct
    WHERE ct.order_id::text = p_order_id
      AND p_user_id::text = ANY(ct.participants_fixed)
  );
$$;

-- 既存の問題あるポリシーを削除
DROP POLICY IF EXISTS "chat_attachments_select_participant" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_insert_participant" ON storage.objects;

-- SELECT: 注文の参加者のみ閲覧可能（SECURITY DEFINER 関数経由）
CREATE POLICY "chat_attachments_select_participant"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND public.is_chat_attachment_allowed(
      (string_to_array(name, '/'))[1],
      auth.uid()
    )
  );

-- INSERT: 注文の参加者のみアップロード可能（SECURITY DEFINER 関数経由）
CREATE POLICY "chat_attachments_insert_participant"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND public.is_chat_attachment_allowed(
      (string_to_array(name, '/'))[1],
      auth.uid()
    )
  );

-- =============================================
-- profiles テーブルの再帰ポリシー修正
-- profiles を参照するポリシーが profiles 自身の SELECT で再帰するため、
-- シンプルなポリシーに置き換え
-- =============================================

-- 再帰の原因になるポリシーを削除（存在する場合のみ）
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_order_participant" ON public.profiles;

-- 認証済みユーザーなら全プロフィール閲覧可能
-- （メールは auth.users 側に保存、profiles には username/role のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_authenticated'
  ) THEN
    CREATE POLICY "profiles_select_authenticated"
      ON public.profiles FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;
