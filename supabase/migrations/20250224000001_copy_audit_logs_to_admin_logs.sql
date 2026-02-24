-- 既存の audit_logs がある場合のみ、admin_logs にコピーする（1回だけ実行）
-- ※ audit_logs テーブルが無い場合はこのマイグレーションをスキップするか、ファイルを削除してください

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    INSERT INTO public.admin_logs (actor_user_id, action, target_type, target_id, meta_json, details, created_at)
    SELECT actor_user_id, action, target_type, target_id, meta_json, details, created_at
    FROM public.audit_logs;
  END IF;
END $$;
