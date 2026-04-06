-- ============================================================
-- UnivaPay移行: Stripe → UnivaPay
-- ============================================================

-- 1. ordersテーブル: UnivaPay用カラム追加（Stripeカラムは残す）
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS univapay_charge_id text,
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'univapay';

-- 既存注文はStripe経由
UPDATE orders SET payment_provider = 'stripe' WHERE payment_intent_id IS NOT NULL OR stripe_checkout_session_id IS NOT NULL;

-- univapay_charge_idにユニークインデックス（冪等性チェック用）
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_univapay_charge_id
  ON orders (univapay_charge_id) WHERE univapay_charge_id IS NOT NULL;

-- 2. profilesテーブル: 銀行口座情報追加（stripe_account_idは残す）
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bank_account_info jsonb;

-- bank_account_info の想定構造:
-- {
--   "bank_name": "三菱UFJ銀行",
--   "branch_name": "渋谷支店",
--   "account_type": "普通",
--   "account_number": "1234567",
--   "account_holder": "ヤマダ タロウ"
-- }

-- 3. withdrawalsテーブル: 手動振込管理用カラム追加
ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS paid_by_admin_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

COMMENT ON COLUMN orders.univapay_charge_id IS 'UnivaPay課金ID';
COMMENT ON COLUMN orders.payment_provider IS '決済プロバイダ (stripe / univapay)';
COMMENT ON COLUMN profiles.bank_account_info IS '銀行口座情報 (JSON)';
COMMENT ON COLUMN withdrawals.paid_by_admin_id IS '振込を実行した管理者ID';
COMMENT ON COLUMN withdrawals.paid_at IS '実際に振込を実行した日時';
