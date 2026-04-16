-- 出金申請に振込手数料カラムを追加（代行者負担）
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS transfer_fee integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.withdrawals.transfer_fee IS '振込手数料（円）。管理者承認時に自動計算。三井住友宛=0、他行宛3万未満=165、3万以上=330';
