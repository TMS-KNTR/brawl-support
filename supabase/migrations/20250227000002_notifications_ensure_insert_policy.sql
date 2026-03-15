-- notifications に通知が入らない場合の修正用
-- テーブルが無ければ作成し、RLS と INSERT ポリシーを確実に作る

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 既存の INSERT 系ポリシーをすべて削除（名前が違う場合があるため）
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND cmd = 'INSERT')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', r.policyname);
  END LOOP;
END $$;

-- INSERT: 認証済みユーザーが誰宛てでも通知を作成できる（チャット送信者が相手に通知を作るため）
CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- SELECT: 自分の通知だけ読める
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- UPDATE: 自分の通知だけ更新（既読など）
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
