import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

/** 監査ログ1件（admin_logs テーブルの想定カラム） */
type AdminLogEntry = {
  id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  created_at: string;
  actor_id?: string;
  actor_user_id?: string;
  details?: string;
  meta_json?: Record<string, unknown> | null;
};

/** アクションの日本語ラベル */
function actionLabel(action: string): string {
  const map: Record<string, string> = {
    REQUEST_ACCEPTED: '受注承諾',
    ORDER_CREATED: '注文作成',
    ORDER_CANCELLED: '注文キャンセル',
    ORDER_COMPLETED: '注文完了',
    REFUND: '返金',
    PAYOUT: '支払い',
    USER_BANNED: 'ユーザーBAN',
    USER_UNBANNED: 'ユーザーBAN解除',
    ROLE_CHANGED: 'ロール変更',
    LOGIN: 'ログイン',
    LOGOUT: 'ログアウト',
    user_warning: 'ユーザー警告',
    user_ban: 'ユーザーBAN',
    user_unban: 'ユーザーBAN解除',
    user_role_changed: 'ロール変更',
    warning_reset: '警告リセット',
    order_force_cancelled: '注文 強制キャンセル+返金',
    order_force_completed: '注文 強制完了+支払い',
    order_force_cancelled_fallback: '注文 キャンセル（返金エラー）',
    order_force_completed_fallback: '注文 完了（支払いエラー）',
    order_status_changed: '注文 ステータス変更',
    dispute_resolved: '紛争 解決',
    dispute_closed: '紛争 却下',
    system_setting_changed: 'システム設定 変更',
    BROADCAST_NOTIFICATION: '一斉通知 送信',
    WITHDRAWAL_APPROVED: '出金 承認',
    WITHDRAWAL_REJECTED: '出金 却下',
    BALANCE_ADJUSTED: '残高 調整',
  };
  return map[action] || action;
}

/** 対象タイプの日本語ラベル */
function targetTypeLabel(targetType: string): string {
  const map: Record<string, string> = {
    user: 'ユーザー',
    order: '注文',
    dispute: '紛争',
    system: 'システム',
    notification: '通知',
    withdrawal: '出金',
    balance: '残高',
    setting: '設定',
  };
  return map[targetType] || targetType;
}

export default function AdminLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (err) {
      setError(
        '監査ログテーブル（admin_logs）が見つかりません。Supabase の SQL エディタでテーブルを作成してください。'
      );
      setLogs([]);
    } else {
      setLogs((data as AdminLogEntry[]) || []);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const q = search.trim().toLowerCase();
      const action = (log.action ?? '').toLowerCase();
      const targetType = (log.target_type ?? '').toLowerCase();
      const targetId = (log.target_id ?? '').toLowerCase();
      const actorId = (log.actor_id ?? log.actor_user_id ?? '').toString().toLowerCase();
      const matchSearch =
        !q ||
        action.includes(q) ||
        targetType.includes(q) ||
        targetId.includes(q) ||
        actorId.includes(q);
      const matchAction = actionFilter === 'all' || (log.action ?? '') === actionFilter;
      const matchTargetType = targetTypeFilter === 'all' || (log.target_type ?? '') === targetTypeFilter;
      return matchSearch && matchAction && matchTargetType;
    });
  }, [logs, search, actionFilter, targetTypeFilter]);

  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const uniqueTargetTypes = useMemo(() => {
    const set = new Set(logs.map((l) => l.target_type).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => navigate('/dashboard/admin')}
                className="text-purple-600 hover:underline text-sm mb-2 block"
              >
                ← 管理者ダッシュボード
              </button>
              <h1 className="text-3xl font-bold text-gray-900">📜 監査ログ</h1>
              <p className="text-sm text-gray-500 mt-1">
                管理者・システムの操作履歴を確認できます。不正操作の追跡に利用してください。
              </p>
            </div>
            <button
              onClick={loadLogs}
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              🔄 更新
            </button>
          </div>

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">{error}</p>
            </div>
          )}

          {!error && (
            <>
              {/* フィルター */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
                <input
                  className="border border-gray-300 rounded-lg px-4 py-2 flex-1 min-w-[200px]"
                  placeholder="アクション・対象タイプ・IDで検索"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-500">アクション:</span>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">すべて</option>
                    {uniqueActions.map((a) => (
                      <option key={a} value={a}>
                        {actionLabel(a)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-500">対象:</span>
                  <select
                    value={targetTypeFilter}
                    onChange={(e) => setTargetTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">すべて</option>
                    {uniqueTargetTypes.map((t) => (
                      <option key={t} value={t}>
                        {targetTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">{filtered.length}件のログ</p>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                  {logs.length === 0
                    ? 'ログがまだありません。操作が記録されるとここに表示されます。'
                    : '該当するログがありません。検索条件を変えてください。'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((log) => {
                    const actorId = log.actor_id ?? log.actor_user_id;
                    const meta = log.meta_json && Object.keys(log.meta_json).length > 0;
                    return (
                      <div
                        key={log.id}
                        className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {actionLabel(log.action)}
                            </span>
                            {log.target_type && (
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                {targetTypeLabel(log.target_type)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                            {log.target_id && (
                              <span className="font-mono">ID: {log.target_id.slice(0, 12)}{log.target_id.length > 12 ? '...' : ''}</span>
                            )}
                            {actorId && (
                              <span className="font-mono">実行者: {String(actorId).slice(0, 8)}...</span>
                            )}
                            {log.details && (
                              <span className="text-gray-500 truncate max-w-xs" title={log.details}>
                                {log.details}
                              </span>
                            )}
                          </div>
                          {meta && (
                            <pre className="mt-2 text-xs bg-gray-50 rounded p-2 overflow-x-auto text-gray-600">
                              {JSON.stringify(log.meta_json)}
                            </pre>
                          )}
                        </div>
                        <div className="shrink-0 text-sm text-gray-400">
                          {new Date(log.created_at).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
