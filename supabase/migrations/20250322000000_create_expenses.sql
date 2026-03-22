-- ============================================================
-- 経費テーブル（確定申告用）
-- ============================================================

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,          -- 'server', 'domain', 'advertising', 'stripe_fee', 'tools', 'other'
  description text NOT NULL,
  amount integer NOT NULL,          -- 円（整数）
  expense_date date NOT NULL,
  receipt_url text,                 -- 領収書画像URL（任意）
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Admin のみ全操作可能（is_admin() SECURITY DEFINER 関数で profiles RLS 再帰を回避）
CREATE POLICY "expenses_admin_select" ON public.expenses
  FOR SELECT USING (public.is_admin());

CREATE POLICY "expenses_admin_insert" ON public.expenses
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "expenses_admin_update" ON public.expenses
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "expenses_admin_delete" ON public.expenses
  FOR DELETE USING (public.is_admin());
