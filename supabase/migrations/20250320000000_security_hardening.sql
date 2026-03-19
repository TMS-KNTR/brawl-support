-- =============================================================
-- セキュリティ強化マイグレーション (2025-03-20)
-- 1. notifications INSERT ポリシー制限
-- 2. messages テーブルに RLS 追加
-- =============================================================

-- -------------------------------------------------------------
-- 1. notifications: INSERT を自分宛のみに制限
--    Edge Function (service_role) は RLS をバイパスするため影響なし
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;

CREATE POLICY "notifications_insert_own"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- -------------------------------------------------------------
-- 2. messages テーブルに RLS を有効化＋ポリシー追加
--    注文の参加者（顧客 or 代行者）のみ読み書き可能
--    管理者は全メッセージにアクセス可能
-- -------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 参加者: 注文の顧客 or 代行者のみ SELECT 可能
CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = messages.order_id
        AND (o.user_id = auth.uid() OR o.employee_id = auth.uid())
    )
  );

-- 管理者: 全メッセージ SELECT 可能
CREATE POLICY "messages_select_admin"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 参加者: 自分が sender_id のメッセージのみ INSERT 可能
CREATE POLICY "messages_insert_participant"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = messages.order_id
        AND (o.user_id = auth.uid() OR o.employee_id = auth.uid())
    )
  );

-- 管理者: 全注文にメッセージ INSERT 可能（介入チャット用）
CREATE POLICY "messages_insert_admin"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 参加者: 自分宛のメッセージのみ UPDATE 可能（既読マーク用）
CREATE POLICY "messages_update_own"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- 管理者: 全メッセージ UPDATE 可能
CREATE POLICY "messages_update_admin"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
