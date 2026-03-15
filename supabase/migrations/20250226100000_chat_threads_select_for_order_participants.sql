-- 依頼者・従業員が自分の注文のチャットスレッドを読めるようにする（決済後チャットボタン表示のため）
-- orders.user_id が依頼者、orders.employee_id が従業員

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_threads') THEN
    ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'chat_threads'
      AND policyname = 'chat_threads_select_order_participants'
    ) THEN
      CREATE POLICY "chat_threads_select_order_participants"
        ON public.chat_threads
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = chat_threads.order_id
            AND (
              o.user_id = auth.uid()
              OR o.employee_id = auth.uid()
            )
          )
        );
    END IF;

    -- 管理者は全スレッドを参照可能
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'chat_threads'
      AND policyname = 'chat_threads_select_admin'
    ) THEN
      CREATE POLICY "chat_threads_select_admin"
        ON public.chat_threads
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
          )
        );
    END IF;
  END IF;
END $$;
