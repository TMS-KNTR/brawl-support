-- ============================================================
-- Security Advisor 警告対応: touch_identity_verifications_updated_at の search_path を固定
-- 元: 20260524000000_identity_verifications.sql で SET search_path を付け忘れていた
-- ============================================================

CREATE OR REPLACE FUNCTION public.touch_identity_verifications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
