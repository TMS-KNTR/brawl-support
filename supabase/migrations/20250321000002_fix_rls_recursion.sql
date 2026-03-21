-- =============================================================
-- RLS 再帰修正マイグレーション (2025-03-21)
--
-- 問題: profiles ↔ orders 間の循環参照で infinite recursion
--   profiles_select_order_participant → orders テーブル参照
--   orders_employee_accept_update → profiles テーブル参照
--
-- 解決:
--   1. profiles SELECT を USING(true) に戻す（元の設計が正しかった）
--      profiles にはメールアドレス等の機密情報がないため安全
--   2. profiles_select_order_participant を削除（chat-data Edge Functionで対応済み）
--   3. orders の旧ポリシーを SECURITY DEFINER 関数経由に修正
-- =============================================================

-- -------------------------------------------------------------
-- 1. profiles SELECT: 認証済みユーザーなら全プロフィール閲覧可能に戻す
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_order_participant" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- -------------------------------------------------------------
-- 2. orders: 旧ポリシーの profiles 直接参照を is_admin() に変更
--    元の USING 句が profiles を直接参照していたため循環参照が発生
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "orders_employee_accept_update" ON public.orders;

-- 従業員用の受注ポリシー（SECURITY DEFINER 関数で profiles 参照を回避）
CREATE OR REPLACE FUNCTION public.is_employee_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('employee', 'worker', 'admin')
  );
$$;

CREATE POLICY "orders_employee_accept_update"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    employee_id IS NULL
    AND status IN ('paid', 'open', 'pending')
    AND public.is_employee_or_admin()
  )
  WITH CHECK (
    employee_id = auth.uid()
    AND status = 'assigned'
  );
