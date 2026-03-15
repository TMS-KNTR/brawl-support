-- システム設定テーブル（key-value形式）
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能（メンテナンスモード等をフロントで参照するため）
CREATE POLICY "system_settings_select_all"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (true);

-- 更新・挿入は管理者のみ
CREATE POLICY "system_settings_upsert_admin"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 初期値を挿入
INSERT INTO public.system_settings (key, value) VALUES
  ('maintenance_mode', 'false'::jsonb),
  ('platform_fee_rate', '0.20'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.system_settings IS 'システム設定（key-value）。管理者画面から変更可能。';
