import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invokeEdgeFunction } from '../../../lib/supabase';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';
import ProtectedRoute from '../../../components/base/ProtectedRoute';

interface KPI {
  pendingOrders: number;
  inProgressOrders: number;
  openDisputes: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  todayOrders: number;
  todayRevenue: number;
  bannedUsers: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadKPI(); }, []);

  async function loadKPI() {
    setLoading(true);
    try {
      const result = await invokeEdgeFunction<{ success: boolean; data: any; error?: string }>('admin-api', { action: 'dashboard-kpi' });
      if (!result.success) {
        console.error('KPI取得エラー:', result.error);
        setLoading(false);
        return;
      }
      const d = result.data;
      setKpi({
        pendingOrders: d.active_orders?.filter((o: any) => ['paid', 'pending', 'open'].includes(o.status)).length ?? 0,
        inProgressOrders: d.active_orders?.filter((o: any) => o.status === 'in_progress' || o.status === 'assigned').length ?? 0,
        openDisputes: d.open_disputes_count ?? 0,
        pendingWithdrawals: d.pending_withdrawals?.length ?? 0,
        pendingWithdrawalAmount: d.pending_withdrawals?.reduce((sum: number, w: any) => sum + (w.amount || 0), 0) ?? 0,
        todayOrders: d.today_orders?.length ?? 0,
        todayRevenue: d.today_orders?.filter((o: any) => o.status !== 'cancelled').reduce((sum: number, o: any) => sum + (o.price || 0), 0) ?? 0,
        bannedUsers: d.banned_users_count ?? 0,
      });
    } catch (err) {
      console.error('KPI取得エラー:', err);
    }
    setLoading(false);
  }

  const alerts = kpi ? [
    kpi.pendingOrders > 0 && { color: 'bg-blue-50 border-blue-300 text-blue-800', icon: '📦', text: `未受注の注文が ${kpi.pendingOrders} 件あります`, to: '/dashboard/admin/orders' },
    kpi.openDisputes > 0 && { color: 'bg-red-50 border-red-300 text-red-800', icon: '⚖', text: `未解決の紛争が ${kpi.openDisputes} 件あります`, to: '/dashboard/admin/disputes' },
    kpi.pendingWithdrawals > 0 && { color: 'bg-yellow-50 border-yellow-300 text-yellow-800', icon: '💰', text: `承認待ちの出金が ${kpi.pendingWithdrawals} 件（¥${kpi.pendingWithdrawalAmount.toLocaleString()}）あります`, to: '/dashboard/admin/withdrawals' },
  ].filter(Boolean) as { color: string; icon: string; text: string; to: string }[] : [];

  const links = [
    { to: '/dashboard/admin/users', icon: '👤', label: 'ユーザー管理', desc: 'ユーザーの一覧・BAN・ロール変更', badge: kpi?.bannedUsers ? `BAN: ${kpi.bannedUsers}` : '' },
    { to: '/dashboard/admin/orders', icon: '📦', label: '注文管理', desc: '全注文の確認・ステータス変更', badge: kpi?.pendingOrders ? `未受注: ${kpi.pendingOrders}` : '' },
    { to: '/dashboard/admin/disputes', icon: '⚖', label: '紛争管理', desc: '紛争の確認・仲裁', badge: kpi?.openDisputes ? `未解決: ${kpi.openDisputes}` : '' },
    { to: '/dashboard/admin/chats', icon: '💬', label: 'チャット管理', desc: 'チャットの監視・ロック', badge: '' },
    { to: '/dashboard/admin/logs', icon: '📜', label: '監査ログ', desc: '操作履歴の確認', badge: '' },
    { to: '/dashboard/admin/metrics', icon: '📊', label: '統計', desc: '売上・ユーザー数など', badge: '' },
    { to: '/dashboard/admin/security', icon: '🔐', label: 'セキュリティ', desc: '警告・BAN・不正検知', badge: '' },
    { to: '/dashboard/admin/system', icon: '⚙', label: 'システム', desc: 'メンテナンスモードなど', badge: '' },
    { to: '/dashboard/admin/ratings', icon: '⭐', label: '従業員の評価', desc: '従業員ごとの評価と件数', badge: '' },
    { to: '/dashboard/admin/withdrawals', icon: '💰', label: '出金管理', desc: '出金申請の承認・却下・残高管理', badge: kpi?.pendingWithdrawals ? `保留: ${kpi.pendingWithdrawals}` : '' },
    { to: '/dashboard/admin/notifications', icon: '🔔', label: '通知管理', desc: '通知履歴・一斉通知・メール送信', badge: '' },
    { to: '/dashboard/admin/reports', icon: '📑', label: '売上レポート', desc: '売上集計・CSVエクスポート・確定申告用', badge: '' },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-28 pb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">管理者ダッシュボード</h1>
            <p className="text-gray-600">サービス全体の管理ができます</p>
          </div>

          {/* KPIサマリー */}
          {loading ? (
            <div className="flex justify-center py-6 mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : kpi && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/dashboard/admin/orders')}>
                  <p className="text-xs text-gray-500">未受注の注文</p>
                  <p className={`text-2xl font-bold ${kpi.pendingOrders > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{kpi.pendingOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/dashboard/admin/orders')}>
                  <p className="text-xs text-gray-500">対応中の注文</p>
                  <p className={`text-2xl font-bold ${kpi.inProgressOrders > 0 ? 'text-purple-600' : 'text-gray-400'}`}>{kpi.inProgressOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/dashboard/admin/disputes')}>
                  <p className="text-xs text-gray-500">未解決の紛争</p>
                  <p className={`text-2xl font-bold ${kpi.openDisputes > 0 ? 'text-red-600' : 'text-gray-400'}`}>{kpi.openDisputes}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/dashboard/admin/withdrawals')}>
                  <p className="text-xs text-gray-500">保留中の出金</p>
                  <p className={`text-2xl font-bold ${kpi.pendingWithdrawals > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{kpi.pendingWithdrawals}</p>
                  {kpi.pendingWithdrawals > 0 && <p className="text-xs text-yellow-600">¥{kpi.pendingWithdrawalAmount.toLocaleString()}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-xs text-gray-500">本日の注文</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.todayOrders} <span className="text-sm font-normal text-gray-400">件</span></p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <p className="text-xs text-gray-500">本日の売上</p>
                  <p className="text-2xl font-bold text-green-600">¥{kpi.todayRevenue.toLocaleString()}</p>
                </div>
              </div>

              {/* アラート */}
              {alerts.length > 0 && (
                <div className="space-y-2 mb-6">
                  {alerts.map((alert, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(alert.to)}
                      className={`w-full text-left border rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 hover:opacity-80 transition ${alert.color}`}
                    >
                      <span>{alert.icon}</span>
                      <span>{alert.text}</span>
                      <span className="ml-auto text-xs opacity-60">→ 対応する</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 機能リンク */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-purple-300 transition text-left relative"
              >
                <p className="text-3xl mb-3">{item.icon}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
                {item.badge && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
