-- メール送信済みフラグ（二重送信防止）
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

COMMENT ON COLUMN public.notifications.email_sent_at IS '通知メール送信日時（未送信はNULL）';
