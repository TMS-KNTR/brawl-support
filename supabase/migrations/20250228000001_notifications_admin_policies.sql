-- 管理者は全通知を閲覧・更新できるようにする

-- SELECT: 管理者は全通知を読める
CREATE POLICY "notifications_select_admin"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- UPDATE: 管理者は全通知を更新できる（email_sent_at の更新など）
CREATE POLICY "notifications_update_admin"
  ON public.notifications FOR UPDATE TO authenticated
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
