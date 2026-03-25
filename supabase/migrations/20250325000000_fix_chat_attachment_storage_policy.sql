-- =============================================
-- chat-attachments ストレージポリシーの修正
-- 1. is_chat_attachment_allowed が存在しないカラム participants_fixed を参照していたのを修正
-- 2. 管理者用の INSERT ポリシーを追加
-- =============================================

-- 修正: participants_fixed → participants（正しいカラム名）
-- また、orders テーブルも参照して確実に参加者チェックを行う
CREATE OR REPLACE FUNCTION public.is_chat_attachment_allowed(p_order_id text, p_user_id uuid)
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

-- 管理者用 INSERT ポリシーを追加（管理者がチャットで画像を送信できるようにする）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'chat_attachments_insert_admin'
  ) THEN
    CREATE POLICY "chat_attachments_insert_admin"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'chat-attachments'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;
