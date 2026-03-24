-- Atomic balance increment to prevent race conditions
CREATE OR REPLACE FUNCTION increment_balance(p_user_id UUID, p_amount BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic order assignment with concurrent order limit check
CREATE OR REPLACE FUNCTION assign_order_if_under_limit(
  p_order_id UUID,
  p_employee_id UUID,
  p_max_active INT DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
  v_active_count INT;
  v_updated INT;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
