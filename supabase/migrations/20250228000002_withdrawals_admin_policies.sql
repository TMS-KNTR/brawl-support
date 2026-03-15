-- 管理者は全出金履歴を閲覧・更新・挿入できるようにする

-- SELECT: 管理者は全レコードを読める
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'withdrawals_select_admin' AND tablename = 'withdrawals'
  ) THEN
    CREATE POLICY "withdrawals_select_admin"
      ON public.withdrawals FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- UPDATE: 管理者は全レコードを更新できる（承認・却下）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'withdrawals_update_admin' AND tablename = 'withdrawals'
  ) THEN
    CREATE POLICY "withdrawals_update_admin"
      ON public.withdrawals FOR UPDATE TO authenticated
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
  END IF;
END $$;

-- INSERT: 管理者は他ユーザー宛ての履歴を挿入できる（残高調整）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'withdrawals_insert_admin' AND tablename = 'withdrawals'
  ) THEN
    CREATE POLICY "withdrawals_insert_admin"
      ON public.withdrawals FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
