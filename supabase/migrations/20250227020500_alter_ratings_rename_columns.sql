-- 既存の ratings テーブルを worker_id/customer_id から employee_id/user_id に揃える
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ratings' AND column_name = 'worker_id'
  ) THEN
    ALTER TABLE public.ratings RENAME COLUMN worker_id TO employee_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ratings' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.ratings RENAME COLUMN customer_id TO user_id;
  END IF;
END $$;

-- ポリシーを最新の定義に合わせて作り直す
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ratings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ratings', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "ratings_insert_customer"
  ON public.ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = ratings.order_id
        AND (o.user_id = auth.uid() OR o.customer_id = auth.uid())
        AND o.status = 'confirmed'
    )
  );

CREATE POLICY "ratings_select_related_or_admin"
  ON public.ratings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR employee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

