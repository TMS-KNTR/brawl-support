-- 通知テーブル（チャット・注文ステータスなど）
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(user_id, read_at) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 自分の通知のみ閲覧・更新可能
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 通知の作成はサービスロール or 他ユーザーへの通知用に INSERT は別ポリシーで（アプリからは認証ユーザーが「相手に」通知を作る）
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.notifications IS 'ユーザー向け通知（チャット・注文状態変更など）';
