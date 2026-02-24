import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

export default function AdminSecurityPage() {
  const navigate = useNavigate();
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [warnedUsers, setWarnedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: banned } = await supabase.from('profiles').select('*').eq('is_banned', true);
    const { data: warned } = await supabase.from('profiles').select('*').gt('warning_count', 0).eq('is_banned', false);
    setBannedUsers(banned || []);
    setWarnedUsers(warned || []);
    setLoading(false);
  }

  async function unban(userId: string) {
    if (!window.confirm('BANを解除しますか？')) return;
    await supabase.from('profiles').update({ is_banned: false, ban_reason: null, banned_at: null }).eq('id', userId);
    loadData();
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/dashboard/admin')} className="text-purple-600 hover:underline text-sm mb-2 block">← 管理者ダッシュボード</button>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔐 セキュリティ</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 text-red-700">BAN中ユーザー（{bannedUsers.length}人）</h2>
              {bannedUsers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500 mb-8">BAN中のユーザーはいません</div>
              ) : (
                <div className="space-y-3 mb-8">
                  {bannedUsers.map((u) => (
                    <div key={u.id} className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{u.username || u.full_name || '名前未設定'}</p>
                        <p className="text-sm text-gray-500">理由: {u.ban_reason || '不明'}</p>
                        <p className="text-xs text-gray-400">BAN日: {u.banned_at ? new Date(u.banned_at).toLocaleDateString() : '-'}</p>
                      </div>
                      <button onClick={() => unban(u.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">BAN解除</button>
                    </div>
                  ))}
                </div>
              )}

              <h2 className="text-xl font-semibold mb-4 text-yellow-700">警告あり（{warnedUsers.length}人）</h2>
              {warnedUsers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">警告されたユーザーはいません</div>
              ) : (
                <div className="space-y-3">
                  {warnedUsers.map((u) => (
                    <div key={u.id} className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{u.username || u.full_name || '名前未設定'}</p>
                        <p className="text-sm text-gray-500">警告回数: {u.warning_count}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{u.role}</span>
                    </div>
                  ))}
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
