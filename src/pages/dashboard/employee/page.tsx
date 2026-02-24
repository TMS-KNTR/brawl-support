import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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

export default function EmployeeDashboardPage() {
  const { user, userProfile, loading } = useAuth();

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

  return <EmployeeDashboardContent />;
}

function EmployeeDashboardContent() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'available' | 'mine' | 'history' | 'wallet'>('available');
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 紛争モーダル
  const [showDispute, setShowDispute] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');

  // 残高・出金
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  // Stripe Connect状態
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<'not_created' | 'incomplete' | 'pending' | 'active'>('not_created');
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.stripe_account_id) {
      setStripeAccountId(userProfile.stripe_account_id);
      // Stripeに実際の状態を問い合わせ
      checkStripeStatus();
    }
  }, [userProfile]);

  /** Stripe口座の実際の状態を確認 */
  async function checkStripeStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('check-stripe-status', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.data?.success) {
        setStripeStatus(res.data.status);
      }
    } catch (err) {
      console.error('Stripe status check failed:', err);
    }
  }

  /** Stripe Connect口座登録を開始 */
  async function startStripeOnboarding() {
    setConnectLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: { return_url: window.location.origin + '/dashboard/employee' },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (res.error) throw new Error(res.error.message);
      const result = res.data;
      if (result?.success && result?.url) {
        window.location.href = result.url; // Stripeの登録画面に移動
      } else {
        throw new Error(result?.error || '口座登録に失敗しました');
      }
    } catch (err: any) {
      alert('エラー: ' + err.message);
    }
    setConnectLoading(false);
  }

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setDataLoading(true);

    // 受注可能: Edge Function で取得（RLSで未割り当て注文が読めない場合に対応）。失敗時は直接クエリにフォールバック
    let avail: any[] = [];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('list-available-orders', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        avail = res.data.data;
      } else {
        throw new Error(res.data?.error || 'list-available-orders failed');
      }
    } catch (_) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['paid', 'pending', 'open', 'PAYMENT_PENDING'])
        .is('employee_id', null)
        .order('created_at', { ascending: false });
      avail = data || [];
    }

    // 自分の案件: 受注済み or 進行中（チャットスレッドも取得）
    const { data: mine } = await supabase
      .from('orders')
      .select(`*, chat_threads(id)`)
      .eq('employee_id', user?.id)
      .in('status', ['assigned', 'in_progress'])
      .order('created_at', { ascending: false });

    // 完了履歴
    const { data: history } = await supabase
      .from('orders')
      .select('*')
      .eq('employee_id', user?.id)
      .in('status', ['completed', 'confirmed'])
      .order('created_at', { ascending: false });

    setAvailableOrders(avail || []);
    setMyOrders(
      (mine || []).map((o: any) => ({
        ...o,
        chat_thread_id: Array.isArray(o.chat_threads)
          ? o.chat_threads[0]?.id ?? null
          : o.chat_threads?.id ?? null,
      }))
    );
    setHistoryOrders(history || []);

    // 残高取得
    const { data: prof } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user?.id)
      .single();
    setBalance(prof?.balance || 0);

    // 出金履歴取得
    const { data: wds } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setWithdrawals(wds || []);

    setDataLoading(false);
  };

  /** 受注する */
  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    const { error } = await supabase
      .from('orders')
      .update({ employee_id: user?.id, status: 'assigned' })
      .eq('id', orderId)
      .is('employee_id', null);

    if (error) {
      alert('受注に失敗しました: ' + error.message);
    } else {
      // チャットスレッドにも従業員を追加
      const { data: thread } = await supabase
        .from('chat_threads')
        .select('id, participants')
        .eq('order_id', orderId)
        .maybeSingle();

      if (thread) {
        const updated = [...(thread.participants || []), user?.id].filter(Boolean);
        await supabase
          .from('chat_threads')
          .update({ participants: updated })
          .eq('id', thread.id);
      }
    }

    setActionLoading(null);
    fetchAll();
  };

  /** ステータス変更 */
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .eq('employee_id', user?.id);

    setActionLoading(null);
    fetchAll();
  };

  /** 紛争作成 */
  const handleCreateDispute = async () => {
    if (!disputeOrderId || !disputeReason) return;
    const order = myOrders.find((o) => o.id === disputeOrderId);
    if (!order) return;

    const { error } = await supabase.from('disputes').insert({
      order_id: disputeOrderId,
      customer_id: order.user_id,
      employee_id: user?.id,
      status: 'open',
      reason: disputeReason,
      description: disputeDesc,
    });

    if (error) {
      alert('紛争作成に失敗: ' + error.message);
    } else {
      alert('紛争を作成しました');
    }
    setShowDispute(false);
    setDisputeReason('');
    setDisputeDesc('');
    setDisputeOrderId(null);
  };

  /** 出金申請 */
  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) { alert('出金額を入力してください'); return; }
    if (amount > balance) { alert('残高が不足しています'); return; }
    if (stripeStatus !== 'active') { alert('先に銀行口座の登録を完了してください'); return; }
    if (!window.confirm(`¥${amount.toLocaleString()} を出金しますか？\n\n登録済みの銀行口座に振り込まれます。`)) return;

    setWithdrawLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('withdraw', {
        body: { amount },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      // supabase.functions.invokeはnon-2xxでもdataにJSONが入ることがある
      const result = res.data;
      if (res.error && !result) {
        // レスポンスボディが取れなかった場合
        throw new Error(res.error.message || 'Edge Functionでエラーが発生しました');
      }
      if (result?.success) {
        alert(`✅ ${result.message}`);
        setBalance(result.new_balance);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchAll();
      } else {
        throw new Error(result?.error || '出金に失敗しました');
      }
    } catch (err: any) {
      alert('❌ エラー: ' + err.message);
    }
    setWithdrawLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      paid: { color: 'bg-green-100 text-green-800', text: '支払済' },
      PAYMENT_PENDING: { color: 'bg-yellow-100 text-yellow-800', text: '決済待ち' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '保留中' },
      open: { color: 'bg-blue-100 text-blue-800', text: '募集中' },
      assigned: { color: 'bg-purple-100 text-purple-800', text: '受注済' },
      in_progress: { color: 'bg-orange-100 text-orange-800', text: '作業中' },
      completed: { color: 'bg-green-100 text-green-800', text: '完了' },
      confirmed: { color: 'bg-green-600 text-white', text: '確認済' },
    };
    const cfg = map[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.text}</span>;
  };

  const tabs = [
    { key: 'available' as const, label: '受注可能', count: availableOrders.length },
    { key: 'mine' as const, label: '自分の案件', count: myOrders.length },
    { key: 'history' as const, label: '完了履歴', count: historyOrders.length },
    { key: 'wallet' as const, label: `💰 残高 ¥${balance.toLocaleString()}`, count: null },
  ];

  return (
    <ProtectedRoute allowedRoles={['employee', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">従業員ダッシュボード</h1>
            <p className="text-gray-600">案件の受注・作業管理ができます</p>
          </div>

          {/* Stripe Connect口座登録バナー */}
          {stripeStatus === 'not_created' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-yellow-800">💳 報酬受取口座が未登録です</p>
                <p className="text-sm text-yellow-700">報酬を受け取るにはStripeで口座登録が必要です</p>
              </div>
              <button
                onClick={startStripeOnboarding}
                disabled={connectLoading}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 text-sm whitespace-nowrap"
              >
                {connectLoading ? '処理中...' : '口座を登録する'}
              </button>
            </div>
          )}
          {stripeStatus === 'incomplete' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-orange-800">⚠ 口座登録が未完了です</p>
                <p className="text-sm text-orange-700">Stripeでの情報入力が完了していません。続きを入力してください</p>
              </div>
              <button
                onClick={startStripeOnboarding}
                disabled={connectLoading}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-sm whitespace-nowrap"
              >
                {connectLoading ? '処理中...' : '登録を続ける'}
              </button>
            </div>
          )}
          {stripeStatus === 'pending' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-blue-700 text-sm">⏳ 口座情報を確認中です（Stripeの審査待ち）</p>
            </div>
          )}
          {stripeStatus === 'active' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 flex items-center justify-between">
              <p className="text-green-700 text-sm">✅ 報酬受取口座: 登録済み（出金可能）</p>
            </div>
          )}

          {/* タブ */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === t.key
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                    {t.count !== null && <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{t.count}</span>}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {dataLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : (
            <>
              {/* 受注可能 */}
              {activeTab === 'available' && (
                <div className="space-y-4">
                  {availableOrders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <p className="text-4xl mb-4">📋</p>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">受注可能な案件はありません</h3>
                      <p className="text-gray-600">新しい案件が入ると表示されます</p>
                    </div>
                  ) : (
                    availableOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.current_rank} → {order.target_rank}
                            </h3>
                            <p className="text-gray-600">{order.game_title} / {order.service_type || 'ランク代行'}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-500">報酬</span>
                            <p className="font-bold text-green-600">¥{(order.price || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">ゲーム</span>
                            <p className="font-medium">{order.game_title}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">依頼日</span>
                            <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAccept(order.id)}
                          disabled={actionLoading === order.id}
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium"
                        >
                          {actionLoading === order.id ? '処理中...' : 'この案件を受注する'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 自分の案件 */}
              {activeTab === 'mine' && (
                <div className="space-y-4">
                  {myOrders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <p className="text-4xl mb-4">🎮</p>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">担当中の案件はありません</h3>
                      <p className="text-gray-600">「受注可能」タブから案件を受注してください</p>
                    </div>
                  ) : (
                    myOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.current_rank} → {order.target_rank}
                            </h3>
                            <p className="text-gray-600">{order.game_title} / {order.service_type || 'ランク代行'}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-500">報酬</span>
                            <p className="font-bold text-green-600">¥{(order.price || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">ゲーム</span>
                            <p className="font-medium">{order.game_title}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">依頼日</span>
                            <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {order.status === 'assigned' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'in_progress')}
                              disabled={actionLoading === order.id}
                              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 font-medium"
                            >
                              {actionLoading === order.id ? '処理中...' : '作業開始'}
                            </button>
                          )}
                          {order.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'completed')}
                              disabled={actionLoading === order.id}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
                            >
                              {actionLoading === order.id ? '処理中...' : '作業完了'}
                            </button>
                          )}
                          {order.chat_thread_id && (
                            <button
                              onClick={() => navigate(`/chat/${order.chat_thread_id}`)}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                            >
                              💬 チャット
                            </button>
                          )}
                          <button
                            onClick={() => { setDisputeOrderId(order.id); setShowDispute(true); }}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium"
                          >
                            紛争を報告
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 完了履歴 */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {historyOrders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <p className="text-4xl mb-4">📊</p>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">完了した案件はありません</h3>
                    </div>
                  ) : (
                    historyOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.current_rank} → {order.target_rank}
                            </h3>
                            <p className="text-gray-600">{order.game_title} / {order.service_type || 'ランク代行'}</p>
                            <p className="text-sm text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <p className="font-bold text-green-600 mt-2">¥{(order.price || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 残高・出金 */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  {/* 残高カード */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <p className="text-sm text-gray-500 mb-1">現在の残高</p>
                    <p className="text-4xl font-bold text-green-600 mb-4">¥{balance.toLocaleString()}</p>

                    {stripeStatus !== 'active' ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-yellow-800 font-medium mb-1">
                          {stripeStatus === 'not_created' ? '⚠ 銀行口座が未登録です' :
                           stripeStatus === 'incomplete' ? '⚠ 口座登録が未完了です' :
                           '⏳ 口座審査中です'}
                        </p>
                        <p className="text-sm text-yellow-700 mb-3">
                          {stripeStatus === 'pending' ? 'Stripeの審査が完了するまでお待ちください' : '出金するには口座登録を完了してください'}
                        </p>
                        {stripeStatus !== 'pending' && (
                          <button
                            onClick={startStripeOnboarding}
                            disabled={connectLoading}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 text-sm"
                          >
                            {connectLoading ? '処理中...' : stripeStatus === 'incomplete' ? '登録を続ける' : '口座を登録する'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowWithdrawModal(true)}
                        disabled={balance <= 0}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
                      >
                        出金申請
                      </button>
                    )}
                  </div>

                  {/* 口座状態 */}
                  <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        stripeStatus === 'active' ? 'bg-green-500' :
                        stripeStatus === 'pending' ? 'bg-blue-500' :
                        stripeStatus === 'incomplete' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}></span>
                      <span className="text-gray-700">銀行口座: {
                        stripeStatus === 'active' ? '登録済み（出金可能）' :
                        stripeStatus === 'pending' ? '審査中' :
                        stripeStatus === 'incomplete' ? '登録未完了' : '未登録'
                      }</span>
                    </div>
                    {stripeStatus !== 'not_created' && (
                      <button
                        onClick={startStripeOnboarding}
                        className="text-purple-600 text-sm hover:underline"
                      >
                        口座情報を更新
                      </button>
                    )}
                  </div>

                  {/* 履歴 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">取引履歴</h3>
                    {withdrawals.length === 0 ? (
                      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                        取引履歴はまだありません
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {withdrawals.map((w) => (
                          <div key={w.id} className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg ${w.type === 'earning' ? '📥' : '📤'}`}>
                                  {w.type === 'earning' ? '📥' : '📤'}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {w.type === 'earning' ? '報酬' : '出金'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  w.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {w.status === 'completed' ? '完了' : '処理中'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{w.description || ''}</p>
                              <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleString()}</p>
                            </div>
                            <p className={`font-bold text-lg ${w.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                              {w.type === 'earning' ? '+' : '-'}¥{(w.amount || 0).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 出金モーダル */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-2">📤 出金申請</h2>
              <p className="text-gray-600 text-sm mb-4">登録済みの銀行口座に振り込まれます</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500">現在の残高</p>
                <p className="text-2xl font-bold text-green-600">¥{balance.toLocaleString()}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">出金額（円）</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例: 5000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={balance}
                />
                <button
                  onClick={() => setWithdrawAmount(String(balance))}
                  className="text-sm text-purple-600 hover:underline mt-1"
                >
                  全額出金
                </button>
              </div>

              {withdrawAmount && parseInt(withdrawAmount) > balance && (
                <p className="text-red-600 text-sm mb-4">⚠ 残高を超えています</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowWithdrawModal(false); setWithdrawAmount(''); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawLoading || !withdrawAmount || parseInt(withdrawAmount) <= 0 || parseInt(withdrawAmount) > balance}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {withdrawLoading ? '処理中...' : '出金する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 紛争モーダル */}
        {showDispute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">紛争を報告</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">理由</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="例: 依頼者と連絡が取れない"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">詳細</label>
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
                  紛争を作成
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
