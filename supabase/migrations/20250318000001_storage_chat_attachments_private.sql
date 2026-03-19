-- chat-attachments バケットを Private に変更
UPDATE storage.buckets
SET public = false
WHERE id = 'chat-attachments';

-- SELECT: 注文の参加者のみ閲覧可能（パスの先頭が order_id）
CREATE POLICY "chat_attachments_select_participant"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id::text = (string_to_array(name, '/'))[1]
        AND (o.user_id = auth.uid() OR o.employee_id = auth.uid())
    )
  );

-- SELECT: 管理者は全ファイル閲覧可能
CREATE POLICY "chat_attachments_select_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- INSERT: 注文の参加者のみアップロード可能
-- 既存の INSERT ポリシーがある場合は置き換え
DROP POLICY IF EXISTS "chat-attachments-upload 14tobej_0" ON storage.objects;

CREATE POLICY "chat_attachments_insert_participant"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id::text = (string_to_array(name, '/'))[1]
        AND (o.user_id = auth.uid() OR o.employee_id = auth.uid())
    )
  );
