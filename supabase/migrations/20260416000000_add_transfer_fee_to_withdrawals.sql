-- 出金申請に振込手数料カラムを追加（代行者負担）
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS transfer_fee integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.withdrawals.transfer_fee IS '振込手数料（円）。管理者承認時に記録。銀行問わず一律145円。';
