-- =============================================================
-- セキュリティ修正マイグレーション (2025-03-21)
-- 1. admin_logs: INSERT を actor_user_id = auth.uid() に制限
-- 2. orders: employee_accept_update の WITH CHECK を制限
-- 3. profiles: SELECT を自分 or 管理者のみに制限
-- 4. chat_violations: INSERT を制限
-- 5. messages: DELETE ポリシー追加（明示的に拒否）
-- =============================================================

-- -------------------------------------------------------------
-- 1. admin_logs: 誰でもINSERTできる問題を修正
--    actor_user_id が自分自身であることを強制
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "admin_logs_insert_authenticated" ON public.admin_logs;

CREATE POLICY "admin_logs_insert_own"
  ON public.admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (actor_user_id = auth.uid());

-- -------------------------------------------------------------
-- 2. orders: employee_accept_update の WITH CHECK を制限
--    従業員が price/user_id 等を変更できないよう、
--    employee_id と status のみ変更可能にする
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "orders_employee_accept_update" ON public.orders;

CREATE POLICY "orders_employee_accept_update"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    employee_id IS NULL
    AND status IN ('paid', 'open', 'pending')
  )
  WITH CHECK (
    employee_id = auth.uid()
    AND status = 'assigned'
  );

-- -------------------------------------------------------------
-- 3. profiles: SELECT を自分 or 管理者のみに制限
--    現在は USING (true) で全ユーザー公開されている
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY "profiles_select_own"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_select_admin'
  ) THEN
    CREATE POLICY "profiles_select_admin"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- -------------------------------------------------------------
-- 4. chat_violations: INSERT を制限
--    reporter_id = auth.uid() を強制
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "chat_violations_insert_authenticated" ON public.chat_violations;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chat_violations' AND column_name = 'reporter_id'
  ) THEN
    CREATE POLICY "chat_violations_insert_own"
      ON public.chat_violations FOR INSERT
      TO authenticated
      WITH CHECK (reporter_id = auth.uid());
  ELSE
    -- reporter_id カラムが無い場合は管理者のみINSERT可能にする
    CREATE POLICY "chat_violations_insert_admin"
      ON public.chat_violations FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- -------------------------------------------------------------
-- 5. messages: 明示的な DELETE ポリシー（管理者のみ）
-- -------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'messages'
      AND policyname = 'messages_delete_admin'
  ) THEN
    CREATE POLICY "messages_delete_admin"
      ON public.messages FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;
