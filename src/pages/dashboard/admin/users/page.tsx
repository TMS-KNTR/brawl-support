import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

function normalizeRole(role: string): string {
  if (role === 'client') return 'customer';
  if (role === 'worker') return 'employee';
  return role;
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    customer: '依頼者',
    employee: '従業員',
    admin: '管理者',
  };
  return map[normalizeRole(role)] || role;
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // 警告モーダル
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnTarget, setWarnTarget] = useState<any>(null);
  const [warnReason, setWarnReason] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setUsers(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        u.id?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q);
      const normalized = normalizeRole(u.role);
      const matchRole = roleFilter === 'all' || normalized === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  /** 警告を与える（2回で自動BAN） */
  async function giveWarning() {
    if (!warnTarget || !warnReason) return;
    const name = warnTarget.username || warnTarget.full_name || warnTarget.id;
    const currentCount = warnTarget.warning_count || 0;
    const newCount = currentCount + 1;

    // 2回目 → 自動BAN
    if (newCount >= 2) {
      if (!window.confirm(`${name} に2回目の警告を与えます。\n\n⚠ 警告2回のため自動的にBANされます。\n\n理由: ${warnReason}\n\n続行しますか？`)) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          warning_count: newCount,
          is_banned: true,
          ban_reason: `警告2回によるBAN（最終警告理由: ${warnReason}）`,
          banned_at: new Date().toISOString(),
        })
        .eq('id', warnTarget.id);

      if (error) { alert('エラー: ' + error.message); return; }
      alert(`${name} に警告を与え、自動BANしました。`);
    } else {
      if (!window.confirm(`${name} に警告を与えますか？\n\n理由: ${warnReason}\n\n現在の警告回数: ${currentCount}回 → ${newCount}回\n（2回でBANになります）`)) return;

      const { error } = await supabase
        .from('profiles')
        .update({ warning_count: newCount })
        .eq('id', warnTarget.id);

      if (error) { alert('エラー: ' + error.message); return; }
      alert(`${name} に警告を与えました（${newCount}/2回）`);
    }

    setShowWarnModal(false);
    setWarnTarget(null);
    setWarnReason('');
    loadUsers();
  }

  /** 警告リセット */
  async function resetWarnings(user: any) {
    const name = user.username || user.full_name || user.id;
    if (!window.confirm(`${name} の警告回数をリセット（0回に戻す）しますか？`)) return;
    const { error } = await supabase.from('profiles').update({ warning_count: 0 }).eq('id', user.id);
    if (error) { alert('エラー: ' + error.message); return; }
    loadUsers();
  }

  /** BAN切り替え */
  async function toggleBan(user: any) {
    const newBan = !user.is_banned;
    const name = user.username || user.full_name || user.id;
    const msg = newBan ? `${name} をBANしますか？` : `${name} のBANを解除しますか？（警告回数もリセットされます）`;
    if (!window.confirm(msg)) return;

    const updates: any = {
      is_banned: newBan,
      ban_reason: newBan ? '管理者による直接BAN' : null,
      banned_at: newBan ? new Date().toISOString() : null,
    };
    // BAN解除時は警告もリセット
    if (!newBan) updates.warning_count = 0;

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) { alert('エラー: ' + error.message); return; }
    loadUsers();
  }

  async function changeRole(user: any, newRole: string) {
    const name = user.username || user.full_name || user.id;
    if (!window.confirm(`${name} のロールを「${roleLabel(newRole)}」に変更しますか？`)) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (error) { alert('エラー: ' + error.message); return; }
    loadUsers();
  }

  const getRoleBadge = (role: string) => {
    const normalized = normalizeRole(role);
    const colorMap: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-800',
      employee: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[normalized] || 'bg-gray-100 text-gray-800'}`}>
        {roleLabel(role)}
      </span>
    );
  };

  const getWarningBadge = (count: number) => {
    if (!count || count === 0) return null;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${count >= 2 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
        ⚠ 警告{count}回
      </span>
    );
  };

  const roles = [
    { key: 'all', label: 'すべて' },
    { key: 'customer', label: '依頼者' },
    { key: 'employee', label: '従業員' },
    { key: 'admin', label: '管理者' },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button onClick={() => navigate('/dashboard/admin')} className="text-purple-600 hover:underline text-sm mb-2 block">← 管理者ダッシュボード</button>
              <h1 className="text-3xl font-bold text-gray-900">👤 ユーザー管理</h1>
            </div>
            <button onClick={loadUsers} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">🔄 更新</button>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
            <input
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1 min-w-[200px]"
              placeholder="ID・ユーザー名で検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap">
              {roles.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRoleFilter(r.key)}
                  className={`px-3 py-1 rounded-full text-sm ${roleFilter === r.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">{filtered.length}人のユーザー</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">該当するユーザーがいません</div>
              ) : (
                filtered.map((u) => {
                  const normalized = normalizeRole(u.role);
                  const warningCount = u.warning_count || 0;
                  return (
                    <div key={u.id} className={`bg-white rounded-lg shadow-sm p-5 ${u.is_banned ? 'border-l-4 border-red-500' : warningCount > 0 ? 'border-l-4 border-yellow-400' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-gray-900">{u.username || u.full_name || '名前未設定'}</p>
                            {getRoleBadge(u.role)}
                            {getWarningBadge(warningCount)}
                            {u.is_banned && <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">BAN中</span>}
                          </div>
                          <p className="text-xs text-gray-400 font-mono">ID: {u.id.slice(0, 12)}...</p>
                          {u.ban_reason && u.is_banned && (
                            <p className="text-xs text-red-500 mt-1">BAN理由: {u.ban_reason}</p>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* 警告ボタン（BAN中でなければ表示） */}
                        {!u.is_banned && normalized !== 'admin' && (
                          <button
                            onClick={() => { setWarnTarget(u); setShowWarnModal(true); }}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200"
                          >
                            ⚠ 警告を与える（{warningCount}/2）
                          </button>
                        )}

                        {/* 警告リセット（警告がある場合） */}
                        {warningCount > 0 && !u.is_banned && (
                          <button
                            onClick={() => resetWarnings(u)}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                          >
                            警告リセット
                          </button>
                        )}

                        {/* BAN/BAN解除 */}
                        {normalized !== 'admin' && (
                          <button
                            onClick={() => toggleBan(u)}
                            className={`px-3 py-1 rounded-lg text-sm ${u.is_banned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                          >
                            {u.is_banned ? 'BAN解除' : '即BAN'}
                          </button>
                        )}

                        {/* ロール変更 */}
                        {normalized !== 'admin' && !u.is_banned && (
                          <>
                            {normalized === 'customer' && (
                              <button onClick={() => changeRole(u, 'employee')} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200">従業員にする</button>
                            )}
                            {normalized === 'employee' && (
                              <button onClick={() => changeRole(u, 'customer')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">依頼者に戻す</button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 警告モーダル */}
        {showWarnModal && warnTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-2">⚠ 警告を与える</h2>
              <p className="text-gray-600 mb-1">
                対象: <strong>{warnTarget.username || warnTarget.full_name || '名前未設定'}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                現在の警告回数: {warnTarget.warning_count || 0}回
                {(warnTarget.warning_count || 0) >= 1 && (
                  <span className="text-red-600 font-medium ml-2">※ この警告でBANになります</span>
                )}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">警告理由</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows={3}
                  placeholder="例: チャットでの不適切な言動"
                  value={warnReason}
                  onChange={(e) => setWarnReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowWarnModal(false); setWarnTarget(null); setWarnReason(''); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={giveWarning}
                  disabled={!warnReason}
                  className={`px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                    (warnTarget.warning_count || 0) >= 1
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                >
                  {(warnTarget.warning_count || 0) >= 1 ? '警告してBANする' : '警告を与える'}
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
