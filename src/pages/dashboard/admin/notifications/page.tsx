import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, logAdminAction } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  email_sent_at: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string;
};

const TYPE_LABELS: Record<string, string> = {
  chat_message: 'チャットメッセージ',
  order_assigned: '注文受注',
  order_in_progress: '作業開始',
  order_completed: '注文完了',
  order_confirmed: '完了確認',
  admin_broadcast: '一斉通知',
};

function typeLabel(type: string) {
  return TYPE_LABELS[type] || type;
}

export default function AdminNotificationsPage() {
  const navigate = useNavigate();

  /* ── 通知一覧 ── */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'emailed' | 'no_email'>('all');

  /* ── 一斉通知モーダル ── */
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [bcTarget, setBcTarget] = useState<'all' | 'customer' | 'employee'>('all');
  const [bcTitle, setBcTitle] = useState('');
  const [bcBody, setBcBody] = useState('');
  const [bcLinkUrl, setBcLinkUrl] = useState('');
  const [bcSendEmail, setBcSendEmail] = useState(false);
  const [bcSending, setBcSending] = useState(false);
  const [bcResult, setBcResult] = useState<string | null>(null);

  /* ── メール再送 ── */
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const items = (data as Notification[]) || [];
    setNotifications(items);

    // ユーザー情報を取得
    const userIds = [...new Set(items.map((n) => n.user_id))];
    if (userIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, username, full_name, role')
        .in('id', userIds);
      if (pData) {
        const map: Record<string, Profile> = {};
        for (const p of pData as Profile[]) map[p.id] = p;
        setProfiles(map);
      }
    }
    setLoading(false);
  }

  /* ── フィルタリング ── */
  const uniqueTypes = useMemo(() => {
    const set = new Set(notifications.map((n) => n.type).filter(Boolean));
    return Array.from(set).sort();
  }, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q) ||
        n.user_id.toLowerCase().includes(q) ||
        (profiles[n.user_id]?.username || '').toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || n.type === typeFilter;

      let matchStatus = true;
      if (statusFilter === 'unread') matchStatus = !n.read_at;
      if (statusFilter === 'read') matchStatus = !!n.read_at;
      if (statusFilter === 'emailed') matchStatus = !!n.email_sent_at;
      if (statusFilter === 'no_email') matchStatus = !n.email_sent_at;

      return matchSearch && matchType && matchStatus;
    });
  }, [notifications, search, typeFilter, statusFilter, profiles]);

  /* ── 統計 ── */
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read_at).length;
    const emailed = notifications.filter((n) => !!n.email_sent_at).length;
    return { total, unread, emailed };
  }, [notifications]);

  /* ── 一斉通知送信 ── */
  async function handleBroadcast() {
    if (!bcTitle.trim()) return;
    setBcSending(true);
    setBcResult(null);

    // 対象ユーザーを取得
    let query = supabase.from('profiles').select('id').eq('is_banned', false);
    if (bcTarget !== 'all') query = query.eq('role', bcTarget);
    const { data: targets, error: tErr } = await query;

    if (tErr || !targets || targets.length === 0) {
      setBcResult('対象ユーザーが見つかりませんでした。');
      setBcSending(false);
      return;
    }

    // 通知レコードを一括挿入
    const rows = targets.map((t: { id: string }) => ({
      user_id: t.id,
      type: 'admin_broadcast',
      title: bcTitle.trim(),
      body: bcBody.trim() || null,
      link_url: bcLinkUrl.trim() || null,
    }));

    const { error: iErr } = await supabase
      .from('notifications')
      .insert(rows);

    if (iErr) {
      setBcResult(`通知の作成に失敗しました: ${iErr.message}`);
      setBcSending(false);
      return;
    }

    // メール送信（オプション）
    let emailCount = 0;
    if (bcSendEmail) {
      // 直前に挿入した通知を取得
      const { data: created } = await supabase
        .from('notifications')
        .select('id, user_id')
        .eq('type', 'admin_broadcast')
        .eq('title', bcTitle.trim())
        .is('email_sent_at', null)
        .order('created_at', { ascending: false })
        .limit(targets.length);

      for (const n of created || []) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({ notification_id: n.id }),
            }
          );
          emailCount++;
        } catch {
          // メール送信失敗はスキップ
        }
      }
    }

    await logAdminAction({
      action: 'BROADCAST_NOTIFICATION',
      targetType: 'notification',
      targetId: '-',
      details: `一斉通知送信: ${targets.length}人 (メール: ${emailCount}件)`,
      meta: { target: bcTarget, title: bcTitle, email: bcSendEmail },
    });

    setBcResult(
      `${targets.length}人に通知を送信しました。${bcSendEmail ? ` メール: ${emailCount}件` : ''}`
    );
    setBcSending(false);
    setBcTitle('');
    setBcBody('');
    setBcLinkUrl('');
    loadNotifications();
  }

  /* ── メール再送 ── */
  async function handleResendEmail(notif: Notification) {
    if (!window.confirm(`メールを再送しますか？\n\nタイトル: ${notif.title}\nユーザーID: ${notif.user_id.slice(0, 8)}...`)) return;
    setResendingId(notif.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            notification_id: notif.id,
          }),
        }
      );
      const result = await res.json().catch(() => ({}));
      if (result.success && !result.skipped) {
        alert('メールを送信しました');
      } else if (result.skipped) {
        alert(`スキップ: ${result.skipped === 'already sent' ? '送信済み' : result.skipped === 'no email' ? 'メールアドレスなし' : result.skipped === 'type not allowed' ? '対象外の通知タイプ' : result.skipped === 'too old' ? '作成から2分以上経過' : result.skipped}`);
      } else {
        alert('メール送信に失敗しました: ' + (result.error || '不明なエラー'));
      }
      await loadNotifications();
    } catch (e: any) {
      alert('エラー: ' + e.message);
    }
    setResendingId(null);
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => navigate('/dashboard/admin')}
                className="text-purple-600 hover:underline text-sm mb-2 block"
              >
                ← 管理者ダッシュボード
              </button>
              <h1 className="text-3xl font-bold text-gray-900">🔔 通知管理</h1>
              <p className="text-sm text-gray-500 mt-1">
                通知履歴の閲覧・一斉通知の送信・メール再送ができます。
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowBroadcast(true); setBcResult(null); }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                📢 一斉通知
              </button>
              <button
                onClick={loadNotifications}
                className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                🔄 更新
              </button>
            </div>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">総通知数</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
              <p className="text-xs text-gray-500">未読</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.emailed}</p>
              <p className="text-xs text-gray-500">メール送信済</p>
            </div>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
            <input
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1 min-w-[200px]"
              placeholder="タイトル・本文・ユーザーID・ユーザー名で検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500">種類:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">すべて</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>{typeLabel(t)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500">状態:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">すべて</option>
                <option value="unread">未読のみ</option>
                <option value="read">既読のみ</option>
                <option value="emailed">メール送信済</option>
                <option value="no_email">メール未送信</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">{filtered.length}件の通知</p>

          {/* 通知一覧 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
              {notifications.length === 0
                ? '通知がまだありません。'
                : '該当する通知がありません。検索条件を変えてください。'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((n) => {
                const profile = profiles[n.user_id];
                const displayName = profile?.username || profile?.full_name || n.user_id.slice(0, 8) + '...';
                return (
                  <div
                    key={n.id}
                    className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                      n.read_at ? 'border-gray-200' : 'border-purple-400'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{n.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                            {typeLabel(n.type)}
                          </span>
                          {!n.read_at && (
                            <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-medium">
                              未読
                            </span>
                          )}
                          {n.email_sent_at && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600">
                              📧 送信済
                            </span>
                          )}
                        </div>
                        {n.body && (
                          <p className="text-sm text-gray-600 mb-1 truncate max-w-lg">{n.body}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          <span>宛先: {displayName}</span>
                          {profile?.role && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              {profile.role}
                            </span>
                          )}
                          {n.link_url && (
                            <span className="text-purple-400 truncate max-w-[200px]">{n.link_url}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <span className="text-sm text-gray-400">
                          {new Date(n.created_at).toLocaleString('ja-JP')}
                        </span>
                        {!n.email_sent_at && (
                          <button
                            onClick={() => handleResendEmail(n)}
                            disabled={resendingId === n.id}
                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition disabled:opacity-50"
                          >
                            {resendingId === n.id ? '送信中...' : '📧 メール送信'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 一斉通知モーダル ── */}
        {showBroadcast && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📢 一斉通知の送信</h2>

              <div className="space-y-4">
                {/* 対象 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">送信対象</label>
                  <select
                    value={bcTarget}
                    onChange={(e) => setBcTarget(e.target.value as typeof bcTarget)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">全ユーザー</option>
                    <option value="customer">顧客のみ</option>
                    <option value="employee">従業員のみ</option>
                  </select>
                </div>

                {/* タイトル */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="例: メンテナンスのお知らせ"
                    value={bcTitle}
                    onChange={(e) => setBcTitle(e.target.value)}
                  />
                </div>

                {/* 本文 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">本文</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    rows={3}
                    placeholder="通知の詳細を入力..."
                    value={bcBody}
                    onChange={(e) => setBcBody(e.target.value)}
                  />
                </div>

                {/* リンクURL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">リンクURL（任意）</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="例: /dashboard/customer"
                    value={bcLinkUrl}
                    onChange={(e) => setBcLinkUrl(e.target.value)}
                  />
                </div>

                {/* メール送信オプション */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bcSendEmail}
                    onChange={(e) => setBcSendEmail(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">メールも同時に送信する</span>
                </label>

                {bcResult && (
                  <div className={`p-3 rounded-lg text-sm ${
                    bcResult.includes('失敗') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {bcResult}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBroadcast(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  閉じる
                </button>
                <button
                  onClick={handleBroadcast}
                  disabled={bcSending || !bcTitle.trim()}
                  className="px-6 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
                >
                  {bcSending ? '送信中...' : '送信する'}
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
