-- ============================================================
-- profiles テーブルの機密列をユーザー自身が変更できないようにする
-- role, is_banned, ban_reason, banned_at, balance, warning_count
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (Edge Functions) は制限しない
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 管理者は制限しない
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- 一般ユーザーによる機密列の変更をブロック
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'ロールの変更は管理者のみ可能です';
  END IF;
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    RAISE EXCEPTION 'BAN状態の変更は管理者のみ可能です';
  END IF;
  IF NEW.ban_reason IS DISTINCT FROM OLD.ban_reason THEN
    RAISE EXCEPTION 'BAN理由の変更は管理者のみ可能です';
  END IF;
  IF NEW.banned_at IS DISTINCT FROM OLD.banned_at THEN
    RAISE EXCEPTION 'BAN日時の変更は管理者のみ可能です';
  END IF;
  IF NEW.balance IS DISTINCT FROM OLD.balance THEN
    RAISE EXCEPTION '残高の変更は管理者のみ可能です';
  END IF;
  IF NEW.warning_count IS DISTINCT FROM OLD.warning_count THEN
    RAISE EXCEPTION '警告回数の変更は管理者のみ可能です';
  END IF;

  RETURN NEW;
END;
$$;

-- 既存のトリガーがあれば削除してから作成
DROP TRIGGER IF EXISTS trg_prevent_self_privilege_escalation ON public.profiles;

CREATE TRIGGER trg_prevent_self_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_privilege_escalation();
