-- =============================================================
-- chat_violations INSERT ポリシー修正
-- 2026-04-13
--
-- 問題: 20250321000000_security_fixes.sql で reporter_id カラムを
--   想定したフェイルセーフが走り、chat_violations_insert_admin
--   ポリシーが適用されていた。実際には reporter_id ではなく
--   user_id カラムを使っているため、管理者以外のユーザーから
--   違反記録ができず、約1ヶ月間 chat_violations へのinsertが
--   全件サイレントに失敗していた。
--
-- 修正: 既存ポリシーを破棄し、user_id = auth.uid() を WITH CHECK
--   として再定義（自分自身の違反のみ insert 可能）
-- =============================================================

DROP POLICY IF EXISTS "chat_violations_insert_admin" ON public.chat_violations;
DROP POLICY IF EXISTS "chat_violations_insert_own" ON public.chat_violations;
DROP POLICY IF EXISTS "chat_violations_insert_authenticated" ON public.chat_violations;

CREATE POLICY "chat_violations_insert_own"
  ON public.chat_violations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
