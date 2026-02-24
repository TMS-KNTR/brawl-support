-- 監査ログ統一テーブル（admin_logs）
-- 操作履歴を1箇所に記録し、管理者画面で参照する

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  meta_json jsonb,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス: 日付・アクション・対象で検索しやすくする
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_type ON public.admin_logs(target_type);

-- RLS: 管理者（profiles.role = 'admin'）のみ閲覧可能。INSERT は認証済みユーザーまたは service role
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 閲覧: admin のみ
CREATE POLICY "admin_logs_select_admin"
  ON public.admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 挿入: 認証済みユーザー（アプリ・Edge Function から記録するため）
CREATE POLICY "admin_logs_insert_authenticated"
  ON public.admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- service role は RLS をバイパスするため、Edge Function からも挿入可能

COMMENT ON TABLE public.admin_logs IS '監査ログ（操作履歴）。管理者画面で参照。';
