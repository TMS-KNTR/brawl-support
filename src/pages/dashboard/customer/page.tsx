import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';
import ProtectedRoute from '../../../components/base/ProtectedRoute';

export default function CustomerDashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // 紛争モーダル
  const [showDispute, setShowDispute] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');

  // loading タイムアウト対策（10秒）
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setDataLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          chat_threads:chat_threads(order_id, id)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw new Error("データ取得エラー: " + error.message);
      }

      console.log("orders from Supabase", data);

      const ordersWithChatId = (data || []).map((order) => {
        // chat_threads が配列でもオブジェクトでも動くようにする
        const thread = Array.isArray(order.chat_threads)
          ? order.chat_threads[0] // 配列なら先頭要素を使う
          : order.chat_threads;    // オブジェクトならそのまま

        return {
          ...order,
          chat_thread_id: thread?.id ?? null,
        };
      });

      setOrders(ordersWithChatId);
    } catch (error: any) {
      console.error("注文取得エラー:", error);
      setError(error.message || "注文の取得に失敗しました");
    } finally {
      setDataLoading(false);
    }
  };

  const handleConfirmComplete = async (orderId) => {
    if (!window.confirm('代行が完了したことを確認しますか？\n\n確認すると従業員に報酬が支払われます。')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('confirm-order', {
        body: { order_id: orderId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      const result = res.data;
      if (result?.success) {
        alert('✅ 完了を確認しました');
        await fetchOrders();
      } else {
        throw new Error(result?.error || '完了確認に失敗しました');
      }
    } catch (error: any) {
      console.error('完了確認エラー:', error);
      alert('完了確認に失敗しました: ' + error.message);
    }
  };

  /** 紛争作成 */
  const handleCreateDispute = async () => {
    if (!disputeOrderId || !disputeReason) return;
    const order = orders.find((o) => o.id === disputeOrderId);
    if (!order) return;

    const { error } = await supabase.from('disputes').insert({
      order_id: disputeOrderId,
      customer_id: user?.id,
      employee_id: order.employee_id,
      status: 'open',
      reason: disputeReason,
      description: disputeDesc,
    });

    if (error) {
      alert('紛争作成に失敗: ' + error.message);
    } else {
      alert('紛争を報告しました。管理者が確認します。');
    }
    setShowDispute(false);
    setDisputeReason('');
    setDisputeDesc('');
    setDisputeOrderId(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', text: '下書き' },
      'PAYMENT_PENDING': { color: 'bg-yellow-100 text-yellow-800', text: '決済待ち' },
      'PAID_UNASSIGNED': { color: 'bg-blue-100 text-blue-800', text: '支払済・未受注' },
      'CLAIMED': { color: 'bg-purple-100 text-purple-800', text: '受注済' },
      'IN_PROGRESS': { color: 'bg-orange-100 text-orange-800', text: '進行中' },
      'DELIVERED': { color: 'bg-green-100 text-green-800', text: '納品済' },
      'COMPLETED': { color: 'bg-green-100 text-green-800', text: '完了' },
      'CONFIRMED': { color: 'bg-green-600 text-white', text: '確認済' },
      'CANCELED': { color: 'bg-red-100 text-red-800', text: 'キャンセル' },
      'DISPUTED': { color: 'bg-red-100 text-red-800', text: '異議申立中' },
      'REFUNDED': { color: 'bg-gray-100 text-gray-800', text: '返金済' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: '保留中' },
      'paid': { color: 'bg-green-100 text-green-800', text: '支払済' },
      'open': { color: 'bg-blue-100 text-blue-800', text: '募集中' },
      'assigned': { color: 'bg-purple-100 text-purple-800', text: '受注済' },
      'in_progress': { color: 'bg-orange-100 text-orange-800', text: '進行中' },
      'completed': { color: 'bg-green-100 text-green-800', text: '完了' },
      'confirmed': { color: 'bg-green-600 text-white', text: '確認済' },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: '不明' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // loading タイムアウト時の UI
  if (loading && loadingTimeout) {
    return (
      <ProtectedRoute allowedRoles={['customer', 'client', 'admin']}>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <i className="ri-error-warning-line text-6xl text-red-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">プロフィール取得に失敗しました</h3>
              <p className="text-gray-600 mb-6">読み込みに時間がかかっています。ページを再読み込みするか、ログインページに戻ってください。</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all whitespace-nowrap"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  ページを再読み込み
                </button>
                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/login')}
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all whitespace-nowrap"
                >
                  <i className="ri-login-box-line mr-2"></i>
                  ログインへ戻る
                </button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['customer', 'client', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">依頼者ダッシュボード</h1>
            <p className="text-gray-600">あなたの依頼状況を管理できます</p>
          </div>

          {/* タブナビゲーション */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-file-list-3-line mr-2"></i>
                  マイ依頼
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'messages'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-message-3-line mr-2"></i>
                  メッセージ
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'account'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-user-settings-line mr-2"></i>
                  アカウント
                </button>
              </nav>
            </div>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">依頼一覧</h2>
                <button
                  onClick={() => window.REACT_APP_NAVIGATE('/request/new')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  新規依頼作成
                </button>
              </div>

              {dataLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <i className="ri-error-warning-line text-6xl text-red-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">データの取得に失敗しました</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={fetchOrders}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all whitespace-nowrap"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    再試行
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <i className="ri-file-list-3-line text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">依頼がありません</h3>
                  <p className="text-gray-600 mb-6">最初の依頼を作成してみましょう</p>
                  <button
                    onClick={() => window.REACT_APP_NAVIGATE('/request/new')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all whitespace-nowrap"
                  >
                    依頼を作成
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {order.title || `${order.current_rank} → ${order.target_rank}`}
                          </h3>
                          <p className="text-gray-600">{order.description || 'Brawl Stars ランク代行'}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-500">地域</span>
                          <p className="font-medium">{order.region || '未設定'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">料金</span>
                          <p className="font-medium">¥{(order.price || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">作成日</span>
                          <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => window.REACT_APP_NAVIGATE(`/order/${order.id}`)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm whitespace-nowrap"
                        >
                          詳細を見る
                        </button>

                        {order.chat_thread_id && (
                          <button
                            onClick={() => window.REACT_APP_NAVIGATE(`/chat/${order.chat_thread_id}`)}
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm whitespace-nowrap"
                          >
                            <i className="ri-message-3-line mr-1"></i>
                            チャット
                          </button>
                        )}

                        {order.status === "completed" && (
                          <button
                            onClick={() => handleConfirmComplete(order.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                          >
                            完了を確認する
                          </button>
                        )}

                        {/* 紛争報告ボタン（作業中〜完了の注文で表示） */}
                        {['assigned', 'in_progress', 'completed'].includes(order.status) && (
                          <button
                            onClick={() => { setDisputeOrderId(order.id); setShowDispute(true); }}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm whitespace-nowrap"
                          >
                            紛争を報告
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <i className="ri-message-3-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">メッセージ</h3>
              <p className="text-gray-600">代行者とのチャットは各依頼の詳細ページからアクセスできます</p>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">アカウント設定</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">役割</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value="依頼者"
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {userProfile?.role === 'client' || userProfile?.role === 'customer' ? '依頼者' : userProfile?.role === 'worker' ? '従業員' : '管理者'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 紛争報告モーダル */}
        {showDispute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">⚠ 紛争を報告</h2>
              <p className="text-sm text-gray-600 mb-4">問題がある場合、管理者に報告できます。管理者が内容を確認し対応します。</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">理由</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  >
                    <option value="">選択してください</option>
                    <option value="作業が進まない">作業が進まない</option>
                    <option value="従業員と連絡が取れない">従業員と連絡が取れない</option>
                    <option value="作業内容が依頼と異なる">作業内容が依頼と異なる</option>
                    <option value="アカウントに問題が発生した">アカウントに問題が発生した</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">詳細（任意）</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="状況を詳しく説明してください"
                    value={disputeDesc}
                    onChange={(e) => setDisputeDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowDispute(false); setDisputeReason(''); setDisputeDesc(''); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreateDispute}
                  disabled={!disputeReason}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  紛争を報告する
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
