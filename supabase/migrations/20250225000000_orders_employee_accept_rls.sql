-- 従業員が「受注する」ときに orders の employee_id を更新できるようにする
-- ※ orders テーブルに RLS が有効な場合のみ必要です。既存ポリシーがある場合は内容を確認してから実行してください。

-- 例: 従業員または管理者が、employee_id が null の注文を更新できるポリシー
-- ポリシー名は既存のものと重複しないようにしてください。

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    -- RLS が有効か確認し、従業員用の UPDATE ポリシーが無ければ追加
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'orders'
      AND policyname = 'orders_employee_accept_update'
    ) THEN
      CREATE POLICY "orders_employee_accept_update"
        ON public.orders
        FOR UPDATE
        TO authenticated
        USING (
          employee_id IS NULL
          AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('employee', 'worker', 'admin')
          )
        )
        WITH CHECK (true);
    END IF;
  END IF;
END $$;
