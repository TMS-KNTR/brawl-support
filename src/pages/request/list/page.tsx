import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';

export default function RequestListPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchOpenRequests();
  }, []);

  const fetchOpenRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_client_id_fkey(email)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('依頼取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId, title) => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    if (!confirm(`「${title}」を受注しますか？`)) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          worker_id: user.id,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // 監査ログ（admin_logs に統一）
      await supabase
        .from('admin_logs')
        .insert({
          actor_user_id: user.id,
          action: 'REQUEST_ACCEPTED',
          target_type: 'order',
          target_id: requestId,
          meta_json: { worker_id: user.id }
        });

      setSuccessMessage(`「${title}」の受注が完了しました！`);
      setShowSuccess(true);
      
      // 一覧を更新
      fetchOpenRequests();

      // 3秒後にメッセージを非表示
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('受注エラー:', error);
      alert('受注に失敗しました。再度お試しください。');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-8">依頼一覧を見るにはログインしてください</p>
          <button
            onClick={() => window.REACT_APP_NAVIGATE('/login')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            ログインページへ
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* 成功メッセージ */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <i className="ri-check-line text-xl mr-2"></i>
          {successMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">依頼一覧</h1>
          <p className="text-gray-600">受注可能な依頼を確認して、あなたのスキルに合った案件を選択してください</p>
        </div>

        {/* 統計情報 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <i className="ri-file-list-3-line text-2xl text-blue-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">受注可能依頼</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">平均報酬</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{requests.length > 0 ? Math.floor(requests.reduce((sum, req) => sum + (req.reward || 0), 0) / requests.length).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <i className="ri-trophy-line text-2xl text-purple-600"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">最高報酬</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{requests.length > 0 ? Math.max(...requests.map(req => req.reward || 0)).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 依頼一覧 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              <i className="ri-list-check-2 mr-2"></i>
              受注可能な依頼
            </h2>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-16">
              <i className="ri-file-list-3-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">受注可能な依頼がありません</h3>
              <p className="text-gray-600">新しい依頼が投稿されるまでお待ちください</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-6">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">
                          {request.title}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          受注可能
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {request.description}
                      </p>

                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <i className="ri-user-line mr-1"></i>
                          依頼者: {request.profiles?.email || '匿名'}
                        </div>
                        <div className="flex items-center">
                          <i className="ri-calendar-line mr-1"></i>
                          投稿日: {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-1">支払金額</div>
                        <div className="text-lg text-gray-900 font-semibold">
                          ¥{request.payment_amount?.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-1">あなたの報酬</div>
                        <div className="text-2xl font-bold text-green-600">
                          ¥{request.reward?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">手数料20%差引後</div>
                      </div>

                      <button
                        onClick={() => handleAcceptRequest(request.id, request.title)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center whitespace-nowrap"
                      >
                        <i className="ri-hand-heart-line mr-2"></i>
                        受注する
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <i className="ri-information-line text-yellow-600 text-xl mt-1 mr-3"></i>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">受注前の注意事項</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 受注後は責任を持って作業を完了してください</li>
                <li>• 依頼者との連絡は迅速かつ丁寧に行ってください</li>
                <li>• 作業内容に不明な点がある場合は、事前に依頼者に確認してください</li>
                <li>• 報酬は作業完了後に支払われます</li>
                <li>• 不適切な行為が発覚した場合、アカウント停止の可能性があります</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}