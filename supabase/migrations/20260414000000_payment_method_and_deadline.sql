-- =============================================================
-- 決済方法（payment_method）と支払い期限（payment_deadline）を追加
-- 2026-04-14
--
-- 目的: コンビニ決済・銀行振込に対応するため、非同期決済方法を
--   識別し、支払い期限内の注文を auto-cancel-orders でクリーンアップ
--   しないようにする。
--
-- payment_method: 'credit_card' | 'konbini' | 'bank_transfer'
-- payment_deadline: コンビニ/銀行振込の場合のみセット（通常7日後）
-- =============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_deadline timestamptz;

-- auto-cancel-orders が pending_payment を効率的に検索するためのインデックス
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment_deadline
  ON public.orders (status, payment_method, payment_deadline)
  WHERE status = 'pending_payment';

COMMENT ON COLUMN public.orders.payment_method IS '決済方法: credit_card / konbini / bank_transfer';
COMMENT ON COLUMN public.orders.payment_deadline IS '支払い期限 (コンビニ/銀行振込の場合のみ)';
