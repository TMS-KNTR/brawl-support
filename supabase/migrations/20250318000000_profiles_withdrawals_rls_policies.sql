-- =============================================
-- profiles テーブルの RLS ポリシー
-- =============================================

-- SELECT: 認証済みユーザーなら閲覧可能
-- （メールアドレスは auth.users 側に保存されているためリスク低）
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

-- UPDATE: 自分のプロフィールのみ更新可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY "profiles_update_own"
      ON public.profiles FOR UPDATE TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- UPDATE: 管理者は全プロフィールを更新可能（BAN等）
-- is_admin() は SECURITY DEFINER 関数のため再帰しない
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_admin'
  ) THEN
    CREATE POLICY "profiles_update_admin"
      ON public.profiles FOR UPDATE TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- INSERT: 新規ユーザー登録時に自分のプロフィールを作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY "profiles_insert_own"
      ON public.profiles FOR INSERT TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- =============================================
-- withdrawals テーブルの RLS ポリシー（従業員用を追加）
-- ※ 管理者用は既存マイグレーションで作成済み
-- =============================================

-- SELECT: 従業員は自分の出金履歴を閲覧可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'withdrawals' AND policyname = 'withdrawals_select_own'
  ) THEN
    CREATE POLICY "withdrawals_select_own"
      ON public.withdrawals FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- INSERT: 従業員は自分の出金申請を作成可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'withdrawals' AND policyname = 'withdrawals_insert_own'
  ) THEN
    CREATE POLICY "withdrawals_insert_own"
      ON public.withdrawals FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
