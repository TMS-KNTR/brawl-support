import { useNavigate } from 'react-router-dom';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';
import ProtectedRoute from '../../../components/base/ProtectedRoute';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const links = [
    { to: '/dashboard/admin/users', icon: '👤', label: 'ユーザー管理', desc: 'ユーザーの一覧・BAN・ロール変更' },
    { to: '/dashboard/admin/orders', icon: '📦', label: '注文管理', desc: '全注文の確認・ステータス変更' },
    { to: '/dashboard/admin/disputes', icon: '⚖', label: '紛争管理', desc: '紛争の確認・仲裁' },
    { to: '/dashboard/admin/chats', icon: '💬', label: 'チャット管理', desc: 'チャットの監視・ロック' },
    { to: '/dashboard/admin/logs', icon: '📜', label: '監査ログ', desc: '操作履歴の確認' },
    { to: '/dashboard/admin/metrics', icon: '📊', label: '統計', desc: '売上・ユーザー数など' },
    { to: '/dashboard/admin/security', icon: '🔐', label: 'セキュリティ', desc: '警告・BAN・不正検知' },
    { to: '/dashboard/admin/system', icon: '⚙', label: 'システム', desc: 'メンテナンスモードなど' },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">管理者ダッシュボード</h1>
            <p className="text-gray-600">サービス全体の管理ができます</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-purple-300 transition text-left"
              >
                <p className="text-3xl mb-3">{item.icon}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
