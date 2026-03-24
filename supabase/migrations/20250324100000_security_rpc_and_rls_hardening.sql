-- ============================================================
-- CRITICAL: increment_balance / assign_order_if_under_limit の権限制限
-- これらの SECURITY DEFINER 関数は service_role からのみ呼び出し可能にする
-- ============================================================

-- increment_balance: 認可チェックを追加
CREATE OR REPLACE FUNCTION increment_balance(p_user_id UUID, p_amount BIGINT)
RETURNS VOID AS $$
BEGIN
  -- service_role からの呼び出しのみ許可
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'この関数は直接呼び出せません';
  END IF;

  UPDATE profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- assign_order_if_under_limit: 認可チェックを追加
CREATE OR REPLACE FUNCTION assign_order_if_under_limit(
  p_order_id UUID,
  p_employee_id UUID,
  p_max_active INT DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
  v_active_count INT;
  v_updated INT;
  v_caller_role TEXT;
BEGIN
  -- service_role または呼び出し者自身が p_employee_id であることを確認
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    -- authenticated の場合は自分自身へのアサインのみ許可
    IF auth.uid() IS NULL OR auth.uid() != p_employee_id THEN
      RAISE EXCEPTION 'この関数は自分自身へのアサインのみ可能です';
    END IF;
    -- さらに employee/worker/admin ロールであることを確認
    SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
    IF v_caller_role NOT IN ('employee', 'worker', 'admin') THEN
      RAISE EXCEPTION '従業員または管理者のみ利用できます';
    END IF;
  END IF;

  -- Lock the employee's current active orders to prevent race conditions
  SELECT COUNT(*) INTO v_active_count
  FROM orders
  WHERE employee_id = p_employee_id
    AND status IN ('assigned', 'in_progress')
  FOR UPDATE;

  IF v_active_count >= p_max_active THEN
    RETURN FALSE;
  END IF;

  -- Attempt to assign the order (only if unassigned and in valid status)
  UPDATE orders
  SET employee_id = p_employee_id, status = 'assigned'
  WHERE id = p_order_id
    AND employee_id IS NULL
    AND status IN ('paid', 'open', 'pending');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- HIGH: SECURITY DEFINER 関数の EXECUTE 権限を制限
-- RLS ポリシー内で使用されるため、完全に revoke はできないが
-- anon ロールからの直接呼び出しを防止
-- ============================================================

REVOKE EXECUTE ON FUNCTION is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION is_employee_or_admin() FROM anon;

-- ============================================================
-- HIGH: profiles テーブルの balance, stripe_account_id を
-- 一般ユーザーから隠すためのビューを作成
-- ============================================================

-- profiles_public ビュー: 一般ユーザー向け（機密カラムを除外）
-- SECURITY INVOKER でクエリ実行者の権限・RLSを適用する
CREATE OR REPLACE VIEW profiles_public
WITH (security_invoker = true) AS
SELECT
  id,
  username,
  full_name,
  role,
  avatar_url,
  is_banned,
  created_at
FROM profiles;

-- ビューへのアクセス権を付与
GRANT SELECT ON profiles_public TO authenticated;
GRANT SELECT ON profiles_public TO anon;

-- ============================================================
-- MEDIUM: balance カラムに非負制約を追加
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'balance_non_negative'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);
  END IF;
END $$;

-- ============================================================
-- MEDIUM: profiles の INSERT 時に role を customer に強制するトリガー
-- （クライアントからの権限昇格を防止）
-- ============================================================

CREATE OR REPLACE FUNCTION force_customer_role_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role からの挿入は制限しない
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- 一般ユーザーからの挿入は必ず customer ロールにする
  NEW.role := 'customer';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_force_customer_role ON profiles;
CREATE TRIGGER trg_force_customer_role
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION force_customer_role_on_insert();
