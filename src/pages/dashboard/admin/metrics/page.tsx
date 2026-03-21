import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invokeEdgeFunction } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

export default function AdminMetricsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMetrics(); }, []);

  async function loadMetrics() {
    setLoading(true);
    try {
      const result = await invokeEdgeFunction<{ success: boolean; data: any; error?: string }>('admin-api', { action: 'get-metrics' });
      if (!result.success) {
        console.error('メトリクス取得エラー:', result.error);
        setLoading(false);
        return;
      }
      const { orders, users, disputes } = result.data;

      const totalOrders = orders?.length ?? 0;
      const paidOrders = orders?.filter((o: any) => o.status === 'paid').length ?? 0;
      const assignedOrders = orders?.filter((o: any) => o.status === 'assigned').length ?? 0;
      const inProgressOrders = orders?.filter((o: any) => o.status === 'in_progress').length ?? 0;
      const completedOrders = orders?.filter((o: any) => ['completed', 'confirmed'].includes(o.status)).length ?? 0;
      const cancelledOrders = orders?.filter((o: any) => o.status === 'cancelled').length ?? 0;
      const totalRevenue = orders?.filter((o: any) => o.status !== 'cancelled').reduce((sum: number, o: any) => sum + (o.price || 0), 0) ?? 0;

      const totalUsers = users?.length ?? 0;
      const customers = users?.filter((u: any) => u.role === 'customer' || u.role === 'client').length ?? 0;
      const employees = users?.filter((u: any) => u.role === 'worker' || u.role === 'employee').length ?? 0;
      const bannedUsers = users?.filter((u: any) => u.is_banned).length ?? 0;

      const openDisputes = disputes?.filter((d: any) => d.status === 'open').length ?? 0;

      setStats({
        totalOrders, paidOrders, assignedOrders, inProgressOrders, completedOrders, cancelledOrders, totalRevenue,
        totalUsers, customers, employees, bannedUsers, openDisputes,
      });
    } catch (err) {
      console.error('メトリクス取得エラー:', err);
    }
    setLoading(false);
  }

  const StatCard = ({ label, value, color = 'text-gray-900', sub = '' }: any) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/dashboard/admin')} className="text-purple-600 hover:underline text-sm mb-2 block">← 管理者ダッシュボード</button>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 統計</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : !stats ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-2">データを取得できませんでした</p>
              <button onClick={loadMetrics} className="text-purple-600 hover:underline text-sm">再試行</button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">売上</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="総売上" value={`¥${stats.totalRevenue.toLocaleString()}`} color="text-green-600" />
                <StatCard label="総注文数" value={stats.totalOrders} />
                <StatCard label="完了" value={stats.completedOrders} color="text-green-600" />
                <StatCard label="キャンセル" value={stats.cancelledOrders} color="text-red-600" />
              </div>

              <h2 className="text-xl font-semibold mb-4 text-gray-700">注文ステータス</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="支払済（未受注）" value={stats.paidOrders} color="text-blue-600" />
                <StatCard label="受注済" value={stats.assignedOrders} color="text-purple-600" />
                <StatCard label="作業中" value={stats.inProgressOrders} color="text-orange-600" />
                <StatCard label="紛争（未解決）" value={stats.openDisputes} color="text-red-600" />
              </div>

              <h2 className="text-xl font-semibold mb-4 text-gray-700">ユーザー</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="総ユーザー数" value={stats.totalUsers} />
                <StatCard label="依頼者" value={stats.customers} color="text-blue-600" />
                <StatCard label="従業員" value={stats.employees} color="text-purple-600" />
                <StatCard label="BAN中" value={stats.bannedUsers} color="text-red-600" />
              </div>
            </>
          )}
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
