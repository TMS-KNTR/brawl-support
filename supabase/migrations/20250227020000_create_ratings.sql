-- 従業員への評価テーブル（user_id = 依頼者, employee_id = 従業員）
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 同じ注文に対する評価は1回だけ
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_order_unique ON public.ratings(order_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを一旦すべて削除
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ratings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ratings', r.policyname);
  END LOOP;
END $$;

-- INSERT: 依頼者本人が、自分の完了済み注文に対してのみ評価できる
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

-- SELECT: 関係者（依頼者・従業員）と管理者だけが閲覧できる
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

COMMENT ON TABLE public.ratings IS '依頼ごとの従業員評価（スコア＋コメント）';

