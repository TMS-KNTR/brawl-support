-- =============================================================
-- RLS ハードニング: disputes, dispute_messages, orders, chat_threads
-- 2025-03-20
-- =============================================================

-- ヘルパー: 管理者チェック (SECURITY DEFINER で profiles RLS 再帰を回避)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- =============================================================
-- 1. disputes テーブル
-- =============================================================
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- SELECT: 顧客 or 代行者 or 管理者
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'disputes'
      AND policyname = 'disputes_select_participant'
  ) THEN
    CREATE POLICY "disputes_select_participant"
      ON public.disputes FOR SELECT
      TO authenticated
      USING (
        customer_id = auth.uid()
        OR employee_id = auth.uid()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'disputes'
      AND policyname = 'disputes_select_admin'
  ) THEN
    CREATE POLICY "disputes_select_admin"
      ON public.disputes FOR SELECT
      TO authenticated
      USING ( public.is_admin() );
  END IF;
END $$;

-- INSERT: 注文の顧客 or 代行者のみ (orders テーブルで確認)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'disputes'
      AND policyname = 'disputes_insert_participant'
  ) THEN
    CREATE POLICY "disputes_insert_participant"
      ON public.disputes FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = disputes.order_id
            AND (o.user_id = auth.uid() OR o.employee_id = auth.uid())
        )
      );
  END IF;
END $$;

-- UPDATE: 管理者のみ (ステータス変更等)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'disputes'
      AND policyname = 'disputes_update_admin'
  ) THEN
    CREATE POLICY "disputes_update_admin"
      ON public.disputes FOR UPDATE
      TO authenticated
      USING ( public.is_admin() )
      WITH CHECK ( public.is_admin() );
  END IF;
END $$;

-- =============================================================
-- 2. dispute_messages テーブル
-- =============================================================
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: 関連する紛争の注文参加者 or 管理者
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dispute_messages'
      AND policyname = 'dispute_messages_select_participant'
  ) THEN
    CREATE POLICY "dispute_messages_select_participant"
      ON public.dispute_messages FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.disputes d
            JOIN public.orders o ON o.id = d.order_id
          WHERE d.id = dispute_messages.dispute_id
            AND (o.user_id = auth.uid() OR o.employee_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dispute_messages'
      AND policyname = 'dispute_messages_select_admin'
  ) THEN
    CREATE POLICY "dispute_messages_select_admin"
      ON public.dispute_messages FOR SELECT
      TO authenticated
      USING ( public.is_admin() );
  END IF;
END $$;

-- INSERT: sender_id = auth.uid() AND 関連する注文の参加者, or 管理者
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dispute_messages'
      AND policyname = 'dispute_messages_insert_participant'
  ) THEN
    CREATE POLICY "dispute_messages_insert_participant"
      ON public.dispute_messages FOR INSERT
      TO authenticated
      WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.disputes d
            JOIN public.orders o ON o.id = d.order_id
          WHERE d.id = dispute_messages.dispute_id
            AND (o.user_id = auth.uid() OR o.employee_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'dispute_messages'
      AND policyname = 'dispute_messages_insert_admin'
  ) THEN
    CREATE POLICY "dispute_messages_insert_admin"
      ON public.dispute_messages FOR INSERT
      TO authenticated
      WITH CHECK (
        sender_id = auth.uid()
        AND public.is_admin()
      );
  END IF;
END $$;

-- =============================================================
-- 3. orders テーブル (既存: orders_employee_accept_update)
--    SELECT ポリシーを追加
-- =============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- SELECT: 顧客は自分の注文を閲覧
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
      AND policyname = 'orders_select_customer'
  ) THEN
    CREATE POLICY "orders_select_customer"
      ON public.orders FOR SELECT
      TO authenticated
      USING ( user_id = auth.uid() );
  END IF;
END $$;

-- SELECT: 代行者は担当注文を閲覧
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
      AND policyname = 'orders_select_employee'
  ) THEN
    CREATE POLICY "orders_select_employee"
      ON public.orders FOR SELECT
      TO authenticated
      USING ( employee_id = auth.uid() );
  END IF;
END $$;

-- SELECT: 管理者は全注文を閲覧
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
      AND policyname = 'orders_select_admin'
  ) THEN
    CREATE POLICY "orders_select_admin"
      ON public.orders FOR SELECT
      TO authenticated
      USING ( public.is_admin() );
  END IF;
END $$;

-- =============================================================
-- 4. chat_threads テーブル (既存: SELECT ポリシー 2 つ)
--    UPDATE: 管理者のみ (スレッドロック等)
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_threads'
      AND policyname = 'chat_threads_update_admin'
  ) THEN
    CREATE POLICY "chat_threads_update_admin"
      ON public.chat_threads FOR UPDATE
      TO authenticated
      USING ( public.is_admin() )
      WITH CHECK ( public.is_admin() );
  END IF;
END $$;
