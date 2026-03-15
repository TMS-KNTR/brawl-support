-- 受注前（従業員未割り当て）でも依頼者がチャット送信できるよう receiver_id を NULL 許可に
ALTER TABLE public.messages
  ALTER COLUMN receiver_id DROP NOT NULL;
