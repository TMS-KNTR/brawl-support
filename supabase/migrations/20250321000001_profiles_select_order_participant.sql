-- =============================================================
-- profiles SELECT: 同じ注文の参加者（顧客↔代行者）が
-- 相手のプロフィールを閲覧できるようにする
-- チャットページ等で送信者名を表示するために必要
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'profiles_select_order_participant'
  ) THEN
    CREATE POLICY "profiles_select_order_participant"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE (o.user_id = auth.uid() AND o.employee_id = profiles.id)
             OR (o.employee_id = auth.uid() AND o.user_id = profiles.id)
        )
      );
  END IF;
END $$;
