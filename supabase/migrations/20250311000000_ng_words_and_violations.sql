-- NGワードリストのデフォルト値
INSERT INTO public.system_settings (key, value, updated_at)
VALUES ('ng_words', '["gametrade","ゲームトレード","line.me","discord.gg","x.com","twitter.com"]', now())
ON CONFLICT (key) DO NOTHING;

-- チャット違反ログテーブル
CREATE TABLE IF NOT EXISTS public.chat_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id text,
  thread_id text,
  message_content text NOT NULL,
  matched_word text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_violations_created_at ON public.chat_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_violations_user_id ON public.chat_violations(user_id);

ALTER TABLE public.chat_violations ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
CREATE POLICY "chat_violations_select_admin"
  ON public.chat_violations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 認証済みユーザーが違反記録を挿入可能
CREATE POLICY "chat_violations_insert_authenticated"
  ON public.chat_violations FOR INSERT TO authenticated
  WITH CHECK (true);
