-- ============================================================
-- profiles.role を auth.users.raw_user_meta_data.display_name に同期
-- Supabase ダッシュボード Authentication > Users の「Display name」列に
-- 実運用で使っていない display_name ではなく role を表示させる
-- ============================================================

-- 1) 同期関数（SECURITY DEFINER で auth.users を更新可能に）
CREATE OR REPLACE FUNCTION public.sync_role_to_display_name()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('display_name', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 一般ユーザーからの直接実行を禁止（トリガー経由のみ）
REVOKE EXECUTE ON FUNCTION public.sync_role_to_display_name() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_role_to_display_name() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_role_to_display_name() FROM authenticated;

-- 2) profiles の INSERT / role UPDATE でトリガー発火
DROP TRIGGER IF EXISTS trigger_sync_role_to_display_name ON public.profiles;

CREATE TRIGGER trigger_sync_role_to_display_name
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_role_to_display_name();

-- 3) 既存ユーザーの一括同期（display_name を role で置き換える）
UPDATE auth.users u
SET raw_user_meta_data =
  COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('display_name', p.role)
FROM public.profiles p
WHERE u.id = p.id;
