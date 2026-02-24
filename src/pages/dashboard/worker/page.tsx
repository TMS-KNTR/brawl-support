import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';
import ProtectedRoute from '../../../components/base/ProtectedRoute';

function normalizeRole(role: any): 'customer' | 'employee' | 'admin' | null {
  if (!role) return null;
  if (role === 'client') return 'customer';
  if (role === 'worker') return 'employee';
  if (role === 'customer' || role === 'employee' || role === 'admin') return role;
  return null;
}

export default function WorkerDashboardPage() {
  const { user, userProfile, loading } = useAuth();
  
  // ✅ 先に role チェック
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(userProfile?.role);
  if (role !== 'employee' && role !== 'admin') {
    return <Navigate to="/dashboard/customer" replace />;
  }

  // ✅ ここから先は employee/admin 確定
  return <WorkerDashboardContent />;
}

function WorkerDashboardContent() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stats, setStats] = useState({
    availableCount: 0,
    assignedCount: 0,
    completedCount: 0,
    totalEarnings: 0,
    averageReward: 0,
    maxReward: 0
  });

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    
    setDataLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchAvailableOrders(),
        fetchAssignedOrders(),
        fetchCompletedOrders()
      ]);
    } catch (error) {
      console.error('データ取得エラー:', error);
      setError('データの取得に失敗しました。再度お試しください。');
    } finally {
      // ✅ 必ず loading を false にする
      setDataLoading(false);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      // 受注可能な依頼を取得（支払済みで未受注の依頼）
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['paid_unassigned', 'open'])
        .is('employee_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('受注可能依頼取得エラー:', error);
        throw error;
      }
      
      setAvailableOrders(data || []);
      
      // 統計を更新
      const rewards = data?.map(order => order.reward || (order.payment_amount * 0.8)) || [];
      setStats(prev => ({
        ...prev,
        availableCount: data?.length || 0,
        averageReward: rewards.length > 0 ? rewards.reduce((a, b) => a + b, 0) / rewards.length : 0,
        maxReward: rewards.length > 0 ? Math.max(...rewards) : 0
      }));
    } catch (error: any) {
      console.error('受注可能依頼取得エラー:', error);
      throw error;
    }
  };

  const fetchAssignedOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('employee_id', user.id)
        .in('status', ['claimed', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('受注済み依頼取得エラー:', error);
        throw error;
      }
      
      setAssignedOrders(data || []);
      
      setStats(prev => ({
        ...prev,
        assignedCount: data?.length || 0
      }));
    } catch (error: any) {
      console.error('受注済み依頼取得エラー:', error);
      throw error;
    }
  };

  const fetchCompletedOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('employee_id', user.id)
        .in('status', ['completed', 'delivered'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('完了依頼取得エラー:', error);
        throw error;
      }
      
      setCompletedOrders(data || []);
      
      // 完了した依頼の総収益を計算
      const totalEarnings = data?.reduce((sum, order) => {
        return sum + (order.reward || (order.payment_amount * 0.8) || 0);
      }, 0) || 0;
      
      setStats(prev => ({
        ...prev,
        completedCount: data?.length || 0,
        totalEarnings
      }));
    } catch (error: any) {
      console.error('完了依頼取得エラー:', error);
      throw error;
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (!user) {
      alert('ログイン情報が取得できません');
      return;
    }
    
    try {
      // プロフィールの存在確認
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // プロフィールが存在しない場合は作成
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id
          });

        if (profileError) {
          console.error('プロフィール作成エラー:', profileError);
          alert('プロフィールの作成に失敗しました。再度お試しください。');
          return;
        }
      }

      // 注文情報を取得（user_idを取得するため）
      const { data: orderData, error: orderFetchError } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (orderFetchError || !orderData) {
        console.error('注文情報取得エラー:', orderFetchError);
        alert('注文情報の取得に失敗しました。');
        return;
      }

      // 注文の受注処理
      const { error } = await supabase
        .from('orders')
        .update({
          employee_id: user.id,
          status: 'claimed'
        })
        .eq('id', orderId)
        .is('employee_id', null); // 他の従業員に取られていないことを確認

      if (error) {
        console.error('受注エラー:', error);
        throw error;
      }

      // システムメッセージを追加
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          order_id: orderId,
          sender_id: user.id,
          receiver_id: orderData.user_id,
          content: '代行者がこの依頼を受注しました',
          is_system: true
        });

      if (messageError) {
        console.error('システムメッセージ追加エラー:', messageError);
        // エラーが出てもメインの処理は続行
      }

      // チャットスレッドに従業員を追加
      const { data: existingThread } = await supabase
        .from('chat_threads')
        .select('participants')
        .eq('order_id', orderId)
        .single();

      if (existingThread) {
        const participants = JSON.parse(existingThread.participants || '[]');
        if (!participants.includes(user.id)) {
          participants.push(user.id);
          
          const { error: updateError } = await supabase
            .from('chat_threads')
            .update({
              participants: JSON.stringify(participants)
            })
            .eq('order_id', orderId);

          if (updateError) {
            console.error('チャットスレッド更新エラー:', updateError);
          }
        }
      }

      setShowSuccess(true);
      
      // データを再取得して一覧を更新
      await fetchAllData();

      // 3秒後にメッセージを非表示
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('受注エラー:', error);
      alert('受注に失敗しました。既に他の従業員に受注されている可能性があります。');
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    if (!confirm(`注文ステータスを「${getStatusText(newStatus)}」に変更しますか？`)) return;

    try {
      // 注文情報を取得（user_idを取得するため）
      const { data: orderData, error: orderFetchError } = await supabase
        .from('orders')
        .select('user_id, employee_id')
        .eq('id', orderId)
        .single();

      if (orderFetchError || !orderData) {
        console.error('注文情報取得エラー:', orderFetchError);
        throw new Error('注文情報の取得に失敗しました');
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .eq('employee_id', user.id); // 自分が受注した依頼のみ更新可能

      if (error) {
        console.error('ステータス更新エラー:', error);
        throw error;
      }

      // 完了時にシステムメッセージを追加
      if (newStatus === 'completed' || newStatus === 'delivered') {
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            order_id: orderId,
            sender_id: user.id,
            receiver_id: orderData.user_id,
            content: 'この依頼は完了しました',
            is_system: true
          });

        if (messageError) {
          console.error('システムメッセージ追加エラー:', messageError);
          // エラーが出てもメインの処理は続行
        }
      }

      // データを再取得
      await fetchAllData();
      alert('ステータスを更新しました');
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  const handleStartChat = async (orderId) => {
    try {
      // 既存のチャットスレッドを確認
      const { data: existingThread } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('order_id', orderId)
        .single();

      if (existingThread) {
        // 既存のチャットに遷移
        window.REACT_APP_NAVIGATE(`/chat/${existingThread.id}`);
      } else {
        // 新しいチャットスレッドを作成
        const order = assignedOrders.find(o => o.id === orderId);
        if (!order) {
          alert('注文情報が見つかりません');
          return;
        }

        const { data: newThread, error } = await supabase
          .from('chat_threads')
          .insert({
            order_id: orderId,
            participants: [order.user_id, user.id]
          })
          .select()
          .single();

        if (error) throw error;

        // 新しいチャットに遷移
        window.REACT_APP_NAVIGATE(`/chat/${newThread.id}`);
      }
    } catch (error) {
      console.error('チャット作成エラー:', error);
      alert('チャットの作成に失敗しました');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'draft': '下書き',
      'payment_pending': '決済待ち',
      'paid_unassigned': '支払済・未受注',
      'claimed': '受注済',
      'in_progress': '進行中',
      'delivered': '納品済',
      'completed': '完了',
      'canceled': 'キャンセル',
      'disputed': '異議申立中',
      'refunded': '返金済',
      'pending': '保留中',
      'open': '募集中'
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', text: '下書き' },
      'payment_pending': { color: 'bg-yellow-100 text-yellow-800', text: '決済待ち' },
      'paid_unassigned': { color: 'bg-blue-100 text-blue-800', text: '支払済・未受注' },
      'claimed': { color: 'bg-purple-100 text-purple-800', text: '受注済' },
      'in_progress': { color: 'bg-orange-100 text-orange-800', text: '進行中' },
      'delivered': { color: 'bg-green-100 text-green-800', text: '納品済' },
      'completed': { color: 'bg-green-100 text-green-800', text: '完了' },
      'canceled': { color: 'bg-red-100 text-red-800', text: 'キャンセル' },
      'disputed': { color: 'bg-red-100 text-red-800', text: '異議申立中' },
      'refunded': { color: 'bg-gray-100 text-gray-800', text: '返金済' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: '保留中' },
      'open': { color: 'bg-blue-100 text-blue-800', text: '募集中' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // エラー表示用のコンポーネント
  const ErrorDisplay = () => (
    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
      <i className="ri-error-warning-line text-6xl text-red-300 mb-4"></i>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">データの取得に失敗しました</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={fetchAllData}
        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
      >
        再試行
      </button>
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={['worker', 'employee', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* 成功メッセージ */}
        {showSuccess && (
          <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center">
              <i className="ri-check-line mr-2"></i>
              受注しました！
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">従業員ダッシュボード</h1>
            <p className="text-gray-600">依頼を受注して収益を得ましょう</p>
          </div>

          {/* アカウント停止中の警告 */}
          {userProfile?.is_banned && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <i className="ri-error-warning-line text-red-600 mr-2 mt-0.5"></i>
                <div className="text-red-800">
                  <p className="font-medium">アカウント停止中</p>
                  <p className="text-sm">このアカウントは現在停止中です。サポートにお問い合わせください。</p>
                </div>
              </div>
            </div>
          )}

          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <i className="ri-file-list-3-line text-blue-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">受注可能依頼</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.availableCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <i className="ri-briefcase-line text-purple-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">受注済み依頼</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.assignedCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <i className="ri-check-line text-green-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">完了依頼</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <i className="ri-money-dollar-circle-line text-yellow-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総収益</p>
                  <p className="text-2xl font-bold text-gray-900">¥{stats.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('available')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'available'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-file-list-3-line mr-2"></i>
                  受注可能依頼 ({stats.availableCount})
                </button>
                <button
                  onClick={() => setActiveTab('assigned')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'assigned'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-briefcase-line mr-2"></i>
                  受注済み依頼 ({stats.assignedCount})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'completed'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-check-line mr-2"></i>
                  完了依頼 ({stats.completedCount})
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
          {activeTab === 'available' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">受注可能依頼</h2>
                <div className="text-sm text-gray-600">
                  平均報酬: ¥{Math.round(stats.averageReward).toLocaleString()} | 
                  最高報酬: ¥{Math.round(stats.maxReward).toLocaleString()}
                </div>
              </div>

              {dataLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              ) : error ? (
                <ErrorDisplay />
              ) : availableOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <i className="ri-file-list-3-line text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">受注可能な依頼がありません</h3>
                  <p className="text-gray-600">新しい依頼が投稿されるまでお待ちください</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {order.game_title || order.title || '依頼タイトル'}
                          </h3>
                          <p className="text-gray-600 mb-2">{order.service_type || order.description || '依頼内容'}</p>
                          <p className="text-sm text-gray-500">
                            依頼者ID: {order.user_id || '不明'}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-500">支払金額</span>
                          <p className="font-medium">¥{(order.price || order.payment_amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">あなたの報酬</span>
                          <p className="font-medium text-green-600">¥{(order.reward || ((order.price || order.payment_amount) * 0.8) || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">投稿日</span>
                          <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {/* workerロール、employeeロール、またはadminロールのみ受注ボタンを表示 */}
                        {(userProfile?.role === 'worker' || userProfile?.role === 'employee' || userProfile?.role === 'admin') && (
                          <>
                            {userProfile?.is_banned ? (
                              <button
                                disabled
                                className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed whitespace-nowrap"
                              >
                                <i className="ri-lock-line mr-2"></i>
                                アカウント停止中
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAcceptOrder(order.id)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all whitespace-nowrap"
                              >
                                <i className="ri-hand-heart-line mr-2"></i>
                                受注する
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => window.REACT_APP_NAVIGATE(`/order/${order.id}`)}
                          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm whitespace-nowrap"
                        >
                          詳細を見る
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assigned' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">受注済み依頼</h2>

              {dataLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              ) : error ? (
                <ErrorDisplay />
              ) : assignedOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <i className="ri-briefcase-line text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">受注済みの依頼がありません</h3>
                  <p className="text-gray-600">依頼を受注して作業を開始しましょう</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {assignedOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {order.game_title || order.title || '依頼タイトル'}
                          </h3>
                          <p className="text-gray-600 mb-2">{order.service_type || order.description || '依頼内容'}</p>
                          <p className="text-sm text-gray-500">
                            依頼者ID: {order.user_id || '不明'}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-500">支払金額</span>
                          <p className="font-medium">¥{(order.price || order.payment_amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">あなたの報酬</span>
                          <p className="font-medium text-green-600">¥{(order.reward || ((order.price || order.payment_amount) * 0.8) || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">受注日</span>
                          <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStartChat(order.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                        >
                          <i className="ri-message-3-line mr-1"></i>
                          チャットへ
                        </button>
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, 'in_progress')}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm whitespace-nowrap"
                        >
                          作業開始
                        </button>
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                        >
                          納品完了
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">完了依頼</h2>

              {dataLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              ) : error ? (
                <ErrorDisplay />
              ) : completedOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <i className="ri-check-line text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">完了した依頼がありません</h3>
                  <p className="text-gray-600">依頼を完了して実績を積み上げましょう</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {completedOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {order.game_title || order.title || '依頼タイトル'}
                          </h3>
                          <p className="text-gray-600 mb-2">{order.service_type || order.description || '依頼内容'}</p>
                          <p className="text-sm text-gray-500">
                            依頼者ID: {order.user_id || '不明'}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">支払金額</span>
                          <p className="font-medium">¥{(order.price || order.payment_amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">獲得報酬</span>
                          <p className="font-medium text-green-600">¥{(order.reward || ((order.price || order.payment_amount) * 0.8) || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">完了日</span>
                          <p className="font-medium">{new Date(order.updated_at || order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      value="従業員"
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {userProfile?.role === 'client' || userProfile?.role === 'customer' ? '依頼者' : 
                       userProfile?.role === 'worker' || userProfile?.role === 'employee' ? '従業員' : '管理者'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}