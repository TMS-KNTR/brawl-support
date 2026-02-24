import { useNavigate } from 'react-router-dom';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

export default function AdminSystemPage() {
  const navigate = useNavigate();

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/dashboard/admin')} className="text-purple-600 hover:underline text-sm mb-2 block">← 管理者ダッシュボード</button>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">⚙ システム設定</h1>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-800">
              システム設定機能は今後追加予定です。メンテナンスモードの切り替え、料金設定の変更などが可能になります。
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">現在の設定</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">サービス状態</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">稼働中</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">対応ゲーム</span>
                <span className="text-gray-900">Brawl Stars</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-700">決済</span>
                <span className="text-gray-900">Stripe（テストモード）</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">バージョン</span>
                <span className="text-gray-900">v15</span>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
