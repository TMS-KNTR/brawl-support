-- チャットメッセージに画像URL用カラムを追加
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_url text;

COMMENT ON COLUMN public.messages.attachment_url IS '添付画像の公開URL（Supabase Storage）';
