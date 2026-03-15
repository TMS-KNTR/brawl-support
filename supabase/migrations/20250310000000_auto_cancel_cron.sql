-- 自動キャンセル設定のデフォルト値を追加
INSERT INTO public.system_settings (key, value, updated_at)
VALUES ('auto_cancel_hours', '48', now())
ON CONFLICT (key) DO NOTHING;

-- pg_cron 拡張を有効化 (Supabase Pro で利用可能)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 1時間ごとに auto-cancel-orders Edge Function を呼び出す cron ジョブ
SELECT cron.schedule(
  'auto-cancel-expired-orders',    -- ジョブ名
  '0 * * * *',                     -- 毎時0分に実行
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-cancel-orders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
