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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <style>{`@keyframes emp-spin-init { to { transform: rotate(360deg); } }`}</style>
        <div className="text-center">
          <div className="relative w-8 h-8 mx-auto mb-3">
            <div className="absolute inset-0 border-2 border-[#E5E5E5] rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-[#111] rounded-full"
              style={{ animation: 'emp-spin-init 0.7s linear infinite' }} />
          </div>
          <p className="text-[12px] text-[#999]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (userProfile?.is_banned) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <i className="ri-forbid-line text-3xl text-[#DC2626] mb-3 block"></i>
          <h2 className="text-[16px] font-bold text-[#111] mb-2">アカウントが停止されています</h2>
          <p className="text-[13px] text-[#666]">お問い合わせください。</p>
        </div>
      </div>
    );
  }

  const role = normalizeRole(userProfile?.role);
  if (role !== 'employee' && role !== 'admin') {
    return <Navigate to="/dashboard/customer" replace />;
  }

  return <EmployeeDashboardContent />;
}

/** プラットフォーム手数料率（payout-employee/confirm-orderのsystem_settingsと合わせる） */
const PLATFORM_FEE_RATE = 0.20;
const EMPLOYEE_RATE = 1 - PLATFORM_FEE_RATE;

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
  const [disputeLoading, setDisputeLoading] = useState(false);

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
  const [ratingStats, setRatingStats] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });

  useEffect(() => {
    if (userProfile?.stripe_account_id) {
      setStripeAccountId(userProfile.stripe_account_id);
    }
    // Stripeオンボーディングから戻ってきた場合もあるので常にチェック
    checkStripeStatus();
  }, [userProfile]);

  /** Stripe口座の実際の状態を確認 */
  async function checkStripeStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('check-stripe-status', {
        body: {},
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
        if (!result.url.startsWith('https://connect.stripe.com')) {
          throw new Error('不正なリダイレクト先が検出されました。');
        }
        // 戻ってきた時に最新のprofileを取得するためキャッシュをクリア
        try { localStorage.removeItem('brawl_support_profile'); } catch {}
        window.location.href = result.url; // Stripeの登録画面に移動
      } else {
        throw new Error(result?.error || '口座登録に失敗しました');
      }
    } catch (err: any) {
      console.error('[stripe-connect]', err);
      alert('口座登録に失敗しました。もう一度お試しください。');
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
        body: {},
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

    // 自分の案件: 受注済み・進行中・依頼完了報告済み（依頼者未確認の completed 含む）
    const { data: mine } = await supabase
      .from('orders')
      .select('*')
      .eq('employee_id', user?.id)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .order('created_at', { ascending: false });

    // チャットスレッドIDを Edge Function で取得（RLS で読めない場合に対応）
    let threadMap: Record<string, string> = {};
    const orderIds = (mine || []).map((o: any) => o.id);
    if (orderIds.length > 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke('get-chat-thread-ids', {
          body: { order_ids: orderIds },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.data?.success && res.data?.data && typeof res.data.data === 'object') {
          threadMap = res.data.data;
        }
      } catch (_) {
        // フォールバック: 従来の join で取得を試す
        const { data: mineWithThreads } = await supabase
          .from('orders')
          .select('id, chat_threads(id)')
          .eq('employee_id', user?.id)
          .in('status', ['assigned', 'in_progress', 'completed']);
        for (const o of mineWithThreads || []) {
          const ct = (o as any).chat_threads;
          const tid = Array.isArray(ct) ? ct[0]?.id : ct?.id;
          if (tid) threadMap[o.id] = tid;
        }
      }
    }

    // 完了履歴（依頼者が「完了を確認」したもののみ。従業員の「依頼完了」報告だけの completed は含めない）
    const { data: history } = await supabase
      .from('orders')
      .select('*')
      .eq('employee_id', user?.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    // 完了履歴のチャットスレッドIDも取得
    const historyIds = (history || []).map((o: any) => o.id);
    let historyThreadMap: Record<string, string> = {};
    if (historyIds.length > 0) {
      try {
        const { data: { session: s2 } } = await supabase.auth.getSession();
        const res2 = await supabase.functions.invoke('get-chat-thread-ids', {
          body: { order_ids: historyIds },
          headers: { Authorization: `Bearer ${s2?.access_token}` },
        });
        if (res2.data?.success && res2.data?.data) {
          historyThreadMap = res2.data.data;
        }
      } catch (_) {}
    }

    setAvailableOrders(avail || []);
    setMyOrders(
      (mine || []).map((o: any) => ({
        ...o,
        chat_thread_id: threadMap[o.id] ?? null,
      }))
    );
    setHistoryOrders(
      (history || []).map((o: any) => ({
        ...o,
        chat_thread_id: historyThreadMap[o.id] ?? null,
      }))
    );

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

    // 評価統計を取得
    const { data: ratingAgg } = await supabase
      .from('ratings')
      .select('score', { count: 'exact' })
      .eq('employee_id', user?.id);
    const count = ratingAgg?.length ?? 0;
    if (count > 0) {
      const sum = ratingAgg.reduce((acc: number, r: any) => acc + (r.score || 0), 0);
      setRatingStats({ avg: sum / count, count });
    } else {
      setRatingStats({ avg: 0, count: 0 });
    }

    setDataLoading(false);
  };

  // 受注確認モーダル
  const [confirmAcceptOrder, setConfirmAcceptOrder] = useState<any | null>(null);

  /** 受注する（Edge Function 経由で RLS をバイパス） */
  const handleAccept = async (orderId: string) => {
    if (!user?.id) return;
    // 確認モーダルを表示
    const order = availableOrders.find((o) => o.id === orderId);
    if (!order) return;
    setConfirmAcceptOrder(order);
  };

  const handleAcceptConfirmed = async () => {
    if (!user?.id || !confirmAcceptOrder) return;
    const orderId = confirmAcceptOrder.id;
    setConfirmAcceptOrder(null);
    setActionLoading(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('accept-order', {
        body: { order_id: orderId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      const result = res.data;
      if (res.error) {
        console.error('[accept-order]', res.error); alert('受注に失敗しました。もう一度お試しください。');
        return;
      }
      if (!result?.success) {
        alert('受注に失敗しました: ' + (result?.error || '不明なエラー'));
        return;
      }

      alert('受注しました！「自分の案件」タブに移動します。');
      setActiveTab('mine');
      await fetchAll();
    } finally {
      setActionLoading(null);
    }
  };

  /** ステータス変更（作業開始・作業完了）Edge Function 経由で RLS をバイパス */
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!user?.id) return;
    const confirmMsg = newStatus === 'in_progress'
      ? 'この案件の作業を開始しますか？'
      : '作業完了として報告しますか？\n\n※ 依頼者が確認後に報酬が支払われます。';
    if (!window.confirm(confirmMsg)) return;
    setActionLoading(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('update-order-status', {
        body: { order_id: orderId, status: newStatus },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      const result = res.data;
      if (res.error) {
        console.error('[update-order-status]', res.error); alert('更新に失敗しました。もう一度お試しください。');
        return;
      }
      if (!result?.success) {
        alert('更新に失敗しました: ' + (result?.error || '不明なエラー'));
        return;
      }
      await fetchAll();
    } finally {
      setActionLoading(null);
    }
  };

  /** 紛争作成 */
  const handleCreateDispute = async () => {
    if (!disputeOrderId || !disputeReason || disputeLoading) return;
    const order = myOrders.find((o) => o.id === disputeOrderId);
    if (!order) return;
    const invalidStatuses = ['cancelled', 'CANCELED', 'DISPUTED', 'REFUNDED', 'confirmed', 'CONFIRMED'];
    if (invalidStatuses.includes(order.status)) {
      alert('この注文は紛争を作成できない状態です。');
      setShowDispute(false); setDisputeReason(''); setDisputeDesc(''); setDisputeOrderId(null);
      return;
    }
    if (!window.confirm('紛争として報告しますか？\n\n管理者が内容を確認し対応します。')) return;

    setDisputeLoading(true);
    try {
      const { error } = await supabase.from('disputes').insert({
        order_id: disputeOrderId,
        customer_id: order.user_id,
        employee_id: user?.id,
        status: 'open',
        reason: disputeReason,
        description: disputeDesc,
      });

      if (error) {
        console.error('[create-dispute]', error); alert('紛争作成に失敗しました。もう一度お試しください。');
      } else {
        alert('紛争を作成しました');
      }
      setShowDispute(false);
      setDisputeReason('');
      setDisputeDesc('');
      setDisputeOrderId(null);
    } finally {
      setDisputeLoading(false);
    }
  };

  const MIN_WITHDRAW_AMOUNT = 300;

  /** 出金申請 */
  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) { alert('出金額を入力してください'); return; }
    if (amount < MIN_WITHDRAW_AMOUNT) { alert(`最低出金額は¥${MIN_WITHDRAW_AMOUNT.toLocaleString()}です`); return; }
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
        await fetchAll();
      } else {
        throw new Error(result?.error || '出金に失敗しました');
      }
    } catch (err: any) {
      console.error('[withdraw]', err); alert('出金に失敗しました。もう一度お試しください。');
    }
    setWithdrawLoading(false);
  };

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    paid:             { label: '支払済',     color: '#059669' },
    PAYMENT_PENDING:  { label: '決済待ち',   color: '#D97706' },
    pending:          { label: '保留中',     color: '#D97706' },
    open:             { label: '募集中',     color: '#2563EB' },
    assigned:         { label: '受注済',     color: '#2563EB' },
    in_progress:      { label: '作業中',     color: '#D97706' },
    completed:        { label: '完了報告済', color: '#059669' },
    confirmed:        { label: '確認済',     color: '#059669' },
    cancelled:        { label: 'キャンセル', color: '#DC2626' },
  };
  /** notesから依頼詳細タグを生成 */
  const getOrderDetails = (order: any) => {
    const notes: string = order.notes || '';
    const tags: { label: string; value: string }[] = [];

    // ガチバトル上げ: ハイチャ解放×XX体, バフィー3つ解放×XX体
    const hcMatch = notes.match(/ハイチャ解放×(\d+)体/);
    const buffyMatch = notes.match(/バフィー3つ解放×(\d+)体/);
    if (hcMatch) tags.push({ label: 'ハイチャ解放', value: `${hcMatch[1]}体` });
    if (buffyMatch) tags.push({ label: 'バフィー3つ解放', value: `${buffyMatch[1]}体` });
    // 旧フォーマット互換
    const p11Match = notes.match(/パワー11×(\d+)体/);
    const oldBuffyMatch = notes.match(/バフィー×(\d+)/);
    if (!hcMatch && p11Match) tags.push({ label: 'ハイチャ解放', value: `${p11Match[1]}体` });
    if (!buffyMatch && oldBuffyMatch) tags.push({ label: 'バフィー3つ解放', value: `${oldBuffyMatch[1]}体` });

    // トロフィー上げ: キャラ名
    const charaMatch = notes.match(/キャラ:\s*(.+?)（(強い|普通|弱い)）/);
    if (charaMatch) {
      tags.push({ label: 'キャラ', value: charaMatch[1] });
      tags.push({ label: '強さ', value: charaMatch[2] });
    }

    return tags;
  };

  const SERVICE_TYPE_LABELS: Record<string, string> = {
    rank: 'ガチバトル上げ',
    trophy: 'トロフィー上げ',
    'trophy-push': 'トロフィー上げ',
    'rank-push': 'ランク上げ',
    championship: 'チャンピオンシップ',
    'daily-quest': 'デイリークエスト',
    'event-clear': 'イベントクリア',
  };
  const getServiceLabel = (type: string) => SERVICE_TYPE_LABELS[type] || type;

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_MAP[status] || { label: status, color: '#9CA3AF' };
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
        style={{ color: cfg.color, background: `${cfg.color}10` }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
        {cfg.label}
      </span>
    );
  };

  const tabs = [
    { key: 'available' as const, label: '受注可能', count: availableOrders.length },
    { key: 'mine' as const, label: '自分の案件', count: myOrders.length },
    { key: 'history' as const, label: '完了履歴', count: historyOrders.length },
    { key: 'wallet' as const, label: `💰 残高 ¥${balance.toLocaleString()}`, count: null },
  ];

  return (
    <ProtectedRoute allowedRoles={['employee', 'admin']}>
      <div className="min-h-screen bg-[#FAFAFA]">
        <style>{`
          @keyframes emp-fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes emp-spin { to { transform: rotate(360deg); } }
        `}</style>

        <Header />

        {/* ═══ Header ═══ */}
        <section className="pt-[72px] border-b border-[#E5E5E5] bg-white">
          <div className="max-w-3xl mx-auto px-6 pt-5 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-[20px] sm:text-[22px] font-bold text-[#111] tracking-tight">代行者ダッシュボード</h1>
                <p className="text-[13px] text-[#888] mt-1">案件の受注・作業管理ができます</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {ratingStats.count > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]">
                    <span className="text-[11px] text-[#888]">評価</span>
                    <span className="text-[13px] text-[#FBBF24]">{'★'.repeat(Math.round(ratingStats.avg))}<span className="text-[#E5E5E5]">{'★'.repeat(5 - Math.round(ratingStats.avg))}</span></span>
                    <span className="text-[11px] text-[#666]">{ratingStats.avg.toFixed(1)}（{ratingStats.count}件）</span>
                  </div>
                )}
                <button
                  onClick={() => navigate('/dashboard/employee/manual')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F0F0F0] transition-colors cursor-pointer"
                >
                  <i className="ri-book-open-line text-[13px] text-[#888]"></i>
                  <span className="text-[11px] font-semibold text-[#666]">マニュアル</span>
                </button>
              </div>
            </div>

            {/* Stripe alerts (inline) */}
            {stripeStatus === 'not_created' && (
              <div className="mt-4 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-[#FCD34D]/40 bg-[#FFFBEB]">
                <div>
                  <p className="text-[12px] font-semibold text-[#92400E]">報酬受取口座が未登録です</p>
                  <p className="text-[11px] text-[#A16207]">Stripeで口座登録が必要です</p>
                </div>
                <button onClick={startStripeOnboarding} disabled={connectLoading}
                  className="px-3.5 py-1.5 text-[11px] font-semibold bg-[#111] text-white rounded-md hover:bg-[#333] transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap">
                  {connectLoading ? '処理中...' : '口座を登録'}
                </button>
              </div>
            )}
            {stripeStatus === 'incomplete' && (
              <div className="mt-4 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-[#FDBA74]/40 bg-[#FFF7ED]">
                <div>
                  <p className="text-[12px] font-semibold text-[#9A3412]">口座登録が未完了です</p>
                  <p className="text-[11px] text-[#C2410C]">情報入力を完了してください</p>
                </div>
                <button onClick={startStripeOnboarding} disabled={connectLoading}
                  className="px-3.5 py-1.5 text-[11px] font-semibold bg-[#111] text-white rounded-md hover:bg-[#333] transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap">
                  {connectLoading ? '処理中...' : '登録を続ける'}
                </button>
              </div>
            )}
            {stripeStatus === 'pending' && (
              <div className="mt-4 px-3.5 py-2.5 rounded-lg border border-[#93C5FD]/40 bg-[#EFF6FF]">
                <p className="text-[11px] text-[#1D4ED8]">口座情報を確認中です（Stripeの審査待ち）</p>
              </div>
            )}
            {stripeStatus === 'active' && (
              <div className="mt-4 px-3.5 py-2.5 rounded-lg border border-[#6EE7B7]/40 bg-[#F0FDF4]">
                <p className="text-[11px] text-[#059669]">報酬受取口座: 登録済み（出金可能）</p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 mt-5 overflow-x-auto -mx-1 px-1">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-[12px] font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === t.key
                      ? 'bg-[#111] text-white'
                      : 'text-[#888] hover:bg-[#F5F5F5] hover:text-[#111]'
                  }`}>
                  {t.label}
                  {t.count !== null && (
                    <span className={`ml-1.5 text-[11px] ${activeTab === t.key ? 'text-white/60' : 'text-[#CCC]'}`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Content ═══ */}
        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-6 pt-6">

            {dataLoading && (
              <div className="py-20 text-center">
                <div className="relative w-8 h-8 mx-auto mb-3">
                  <div className="absolute inset-0 border-2 border-[#E5E5E5] rounded-full" />
                  <div className="absolute inset-0 border-2 border-transparent border-t-[#111] rounded-full"
                    style={{ animation: 'emp-spin 0.7s linear infinite' }} />
                </div>
                <p className="text-[12px] text-[#999]">読み込み中...</p>
              </div>
            )}

            {!dataLoading && (
              <>
                {/* 受注可能 */}
                {activeTab === 'available' && (
                  <div className="space-y-3">
                    {availableOrders.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-[#F5F5F5] mx-auto mb-4 flex items-center justify-center">
                          <i className="ri-file-list-3-line text-xl text-[#999]"></i>
                        </div>
                        <p className="text-[15px] font-semibold text-[#111] mb-1.5">受注可能な案件はありません</p>
                        <p className="text-[13px] text-[#888]">新しい案件が入ると表示されます</p>
                      </div>
                    ) : (
                      availableOrders.map((order, idx) => (
                        <div key={order.id}
                          className="rounded-lg bg-white border border-[#E5E5E5] overflow-hidden hover:border-[#CCC] transition-colors duration-200"
                          style={{ animation: `emp-fadeUp 0.35s ease ${0.04 * idx}s both` }}>
                          <div className="p-4 sm:p-5">
                            <div className="flex items-center gap-1.5 mb-2 text-[12px] text-[#666]">
                              <span className="font-semibold text-[#111]">{order.game_title || 'Brawl Stars'}</span>
                              <span className="text-[#CCC]">/</span>
                              <span>{getServiceLabel(order.service_type || '')}</span>
                              <span className="ml-auto">{getStatusBadge(order.status)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[16px] font-bold text-[#111]">{order.current_rank || '—'}</span>
                                <i className="ri-arrow-right-s-line text-[13px] text-[#CCC]"></i>
                                <span className="text-[16px] font-bold text-[#111]">{order.target_rank || '—'}</span>
                              </div>
                              <span className="shrink-0 text-right">
                                <span className="block text-[9px] text-[#999]">報酬</span>
                                <span className="text-[14px] font-bold text-[#059669]">¥{Math.floor((order.price || 0) * EMPLOYEE_RATE).toLocaleString()}</span>
                              </span>
                            </div>
                            {getOrderDetails(order).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {getOrderDetails(order).map((tag, ti) => (
                                  <span key={ti} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F5F5F5] text-[10px] text-[#666]">
                                    <span className="text-[#999]">{tag.label}</span>
                                    <span className="font-semibold text-[#111]">{tag.value}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#BBB]">{new Date(order.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              <button onClick={() => handleAccept(order.id)} disabled={actionLoading === order.id}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer bg-[#111] text-white hover:bg-[#333] transition-colors disabled:opacity-40">
                                {actionLoading === order.id ? '処理中...' : 'この案件を受注する'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 自分の案件 */}
                {activeTab === 'mine' && (
                  <div className="space-y-3">
                    {myOrders.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-[#F5F5F5] mx-auto mb-4 flex items-center justify-center">
                          <i className="ri-gamepad-line text-xl text-[#999]"></i>
                        </div>
                        <p className="text-[15px] font-semibold text-[#111] mb-1.5">担当中の案件はありません</p>
                        <p className="text-[13px] text-[#888]">「受注可能」タブから案件を受注してください</p>
                      </div>
                    ) : (
                      myOrders.map((order, idx) => (
                        <div key={order.id}
                          className="rounded-lg bg-white border border-[#E5E5E5] overflow-hidden hover:border-[#CCC] transition-colors duration-200 cursor-pointer"
                          onClick={() => navigate(`/dashboard/employee/order/${order.id}`)}
                          style={{ animation: `emp-fadeUp 0.35s ease ${0.04 * idx}s both` }}>
                          <div className="p-4 sm:p-5">
                            <div className="flex items-center gap-1.5 mb-2 text-[12px] text-[#666]">
                              <span className="font-semibold text-[#111]">{order.game_title || 'Brawl Stars'}</span>
                              <span className="text-[#CCC]">/</span>
                              <span>{getServiceLabel(order.service_type || '')}</span>
                              <span className="ml-auto">{getStatusBadge(order.status)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[16px] font-bold text-[#111]">{order.current_rank || '—'}</span>
                                <i className="ri-arrow-right-s-line text-[13px] text-[#CCC]"></i>
                                <span className="text-[16px] font-bold text-[#111]">{order.target_rank || '—'}</span>
                              </div>
                              <span className="shrink-0 text-right">
                                <span className="block text-[9px] text-[#999]">報酬</span>
                                <span className="text-[14px] font-bold text-[#059669]">¥{Math.floor((order.price || 0) * EMPLOYEE_RATE).toLocaleString()}</span>
                              </span>
                            </div>
                            {getOrderDetails(order).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {getOrderDetails(order).map((tag, ti) => (
                                  <span key={ti} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F5F5F5] text-[10px] text-[#666]">
                                    <span className="text-[#999]">{tag.label}</span>
                                    <span className="font-semibold text-[#111]">{tag.value}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-[10px] text-[#BBB]">{new Date(order.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-[#F0F0F0]" onClick={(e) => e.stopPropagation()}>
                              {order.status === 'assigned' && (
                                <button onClick={() => handleStatusChange(order.id, 'in_progress')} disabled={actionLoading === order.id}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer bg-[#D97706] text-white hover:bg-[#B45309] transition-colors disabled:opacity-40">
                                  <i className="ri-play-line text-[11px]"></i>{actionLoading === order.id ? '処理中...' : '作業開始'}
                                </button>
                              )}
                              {order.status === 'in_progress' && (
                                <button onClick={() => handleStatusChange(order.id, 'completed')} disabled={actionLoading === order.id}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer bg-[#059669] text-white hover:bg-[#047857] transition-colors disabled:opacity-40">
                                  <i className="ri-check-double-line text-[11px]"></i>{actionLoading === order.id ? '処理中...' : '作業完了'}
                                </button>
                              )}
                              {order.chat_thread_id && (
                                <button onClick={() => navigate(`/chat/${order.chat_thread_id}`)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer text-[#111] border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors">
                                  <i className="ri-message-3-line text-[11px]"></i>チャット
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 完了履歴 */}
                {activeTab === 'history' && (
                  <div className="space-y-3">
                    {historyOrders.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-[#F5F5F5] mx-auto mb-4 flex items-center justify-center">
                          <i className="ri-history-line text-xl text-[#999]"></i>
                        </div>
                        <p className="text-[15px] font-semibold text-[#111] mb-1.5">完了した案件はありません</p>
                      </div>
                    ) : (
                      historyOrders.map((order, idx) => (
                        <div key={order.id}
                          className="rounded-lg bg-white border border-[#E5E5E5] overflow-hidden hover:border-[#CCC] transition-colors duration-200 cursor-pointer"
                          onClick={() => navigate(`/dashboard/employee/order/${order.id}`)}
                          style={{ animation: `emp-fadeUp 0.35s ease ${0.04 * idx}s both` }}>
                          <div className="p-4 sm:p-5">
                            <div className="flex items-center gap-1.5 mb-2 text-[12px] text-[#666]">
                              <span className="font-semibold text-[#111]">{order.game_title || 'Brawl Stars'}</span>
                              <span className="text-[#CCC]">/</span>
                              <span>{getServiceLabel(order.service_type || '')}</span>
                              <span className="ml-auto">{getStatusBadge(order.status)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[16px] font-bold text-[#111]">{order.current_rank || '—'}</span>
                                <i className="ri-arrow-right-s-line text-[13px] text-[#CCC]"></i>
                                <span className="text-[16px] font-bold text-[#111]">{order.target_rank || '—'}</span>
                              </div>
                              <span className="shrink-0 text-right">
                                <span className="block text-[9px] text-[#999]">報酬</span>
                                <span className="text-[14px] font-bold text-[#059669]">¥{Math.floor((order.price || 0) * EMPLOYEE_RATE).toLocaleString()}</span>
                              </span>
                            </div>
                            {getOrderDetails(order).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
                                {getOrderDetails(order).map((tag, ti) => (
                                  <span key={ti} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F5F5F5] text-[10px] text-[#666]">
                                    <span className="text-[#999]">{tag.label}</span>
                                    <span className="font-semibold text-[#111]">{tag.value}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-[#BBB]">{new Date(order.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              {order.chat_thread_id && (
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/chat/${order.chat_thread_id}`); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md cursor-pointer text-[#111] border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors">
                                  <i className="ri-message-3-line text-[11px]"></i>チャット
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 残高・出金 */}
                {activeTab === 'wallet' && (
                  <div className="space-y-3">
                    {/* 残高カード */}
                    <div className="rounded-lg bg-white border border-[#E5E5E5] p-5">
                      <p className="text-[11px] text-[#888] mb-1">現在の残高</p>
                      <p className="text-[28px] font-bold text-[#111] mb-4">¥{balance.toLocaleString()}</p>

                      {stripeStatus !== 'active' ? (
                        <div className="px-3.5 py-2.5 rounded-lg border border-[#FCD34D]/40 bg-[#FFFBEB] mb-4">
                          <p className="text-[12px] font-semibold text-[#92400E] mb-0.5">
                            {stripeStatus === 'not_created' ? '銀行口座が未登録です' :
                             stripeStatus === 'incomplete' ? '口座登録が未完了です' :
                             '口座審査中です'}
                          </p>
                          <p className="text-[11px] text-[#A16207] mb-2.5">
                            {stripeStatus === 'pending' ? 'Stripeの審査が完了するまでお待ちください' : '出金するには口座登録を完了してください'}
                          </p>
                          {stripeStatus !== 'pending' && (
                            <button onClick={startStripeOnboarding} disabled={connectLoading}
                              className="px-3.5 py-1.5 text-[11px] font-semibold bg-[#111] text-white rounded-md hover:bg-[#333] transition-colors disabled:opacity-40 cursor-pointer">
                              {connectLoading ? '処理中...' : stripeStatus === 'incomplete' ? '登録を続ける' : '口座を登録する'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <button onClick={() => setShowWithdrawModal(true)} disabled={balance <= 0}
                          className="px-5 py-2.5 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40 cursor-pointer">
                          出金申請
                        </button>
                      )}
                    </div>

                    {/* 口座状態 */}
                    <div className="rounded-lg bg-white border border-[#E5E5E5] p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{
                          background: stripeStatus === 'active' ? '#059669' :
                            stripeStatus === 'pending' ? '#2563EB' :
                            stripeStatus === 'incomplete' ? '#D97706' : '#D97706'
                        }} />
                        <span className="text-[12px] text-[#666]">銀行口座: {
                          stripeStatus === 'active' ? '登録済み（出金可能）' :
                          stripeStatus === 'pending' ? '審査中' :
                          stripeStatus === 'incomplete' ? '登録未完了' : '未登録'
                        }</span>
                      </div>
                      {stripeStatus !== 'not_created' && (
                        <button onClick={startStripeOnboarding}
                          className="text-[11px] text-[#888] hover:text-[#111] transition-colors cursor-pointer">
                          口座情報を更新
                        </button>
                      )}
                    </div>

                    {/* 取引履歴 */}
                    <div className="pt-3">
                      <h3 className="text-[14px] font-bold text-[#111] mb-3">取引履歴</h3>
                      {withdrawals.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-[13px] text-[#999]">取引履歴はまだありません</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {withdrawals.map((w) => (
                            <div key={w.id} className="rounded-lg bg-white border border-[#E5E5E5] p-4 flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <i className={`${w.type === 'earning' ? 'ri-arrow-down-line text-[#059669]' : 'ri-arrow-up-line text-[#DC2626]'} text-[13px]`}></i>
                                  <span className="text-[12px] font-semibold text-[#111]">
                                    {w.type === 'earning' ? '報酬' : '出金'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                    style={{
                                      color: w.status === 'completed' ? '#059669' : w.status === 'rejected' ? '#DC2626' : '#D97706',
                                      background: w.status === 'completed' ? '#F0FDF4' : w.status === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                                    }}>
                                    {w.status === 'completed' ? '完了' : w.status === 'rejected' ? '却下' : '処理中'}
                                  </span>
                                </div>
                                {w.description && <p className="text-[10px] text-[#999] mt-1">{w.description}</p>}
                                <p className="text-[10px] text-[#BBB] mt-0.5">{new Date(w.created_at).toLocaleString()}</p>
                              </div>
                              <p className={`text-[14px] font-bold ${w.type === 'earning' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
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
        </section>

        {/* ═══ 出金モーダル ═══ */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowWithdrawModal(false); setWithdrawAmount(''); }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#F0F0F0]">
                <h2 className="text-[15px] font-bold text-[#111]">出金申請</h2>
                <p className="text-[11px] text-[#999] mt-0.5">登録済みの銀行口座に振り込まれます</p>
              </div>
              <div className="p-6">
                <div className="rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] p-4 mb-4">
                  <p className="text-[11px] text-[#888]">現在の残高</p>
                  <p className="text-[22px] font-bold text-[#111]">¥{balance.toLocaleString()}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">出金額（円）</label>
                  <input type="number"
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
                    placeholder="例: 5000" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} max={balance} />
                  <button onClick={() => setWithdrawAmount(String(balance))}
                    className="text-[11px] text-[#888] hover:text-[#111] transition-colors mt-1 cursor-pointer">
                    全額出金
                  </button>
                </div>

                {withdrawAmount && parseInt(withdrawAmount) > balance && (
                  <p className="text-[11px] text-[#DC2626] mb-4">残高を超えています</p>
                )}
                {withdrawAmount && parseInt(withdrawAmount) > 0 && parseInt(withdrawAmount) < MIN_WITHDRAW_AMOUNT && (
                  <p className="text-[11px] text-[#D97706] mb-4">最低出金額は¥{MIN_WITHDRAW_AMOUNT.toLocaleString()}です</p>
                )}

                <div className="flex justify-end gap-2.5 pt-1">
                  <button onClick={() => { setShowWithdrawModal(false); setWithdrawAmount(''); }}
                    className="px-4 py-2 text-[12px] font-semibold text-[#666] rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                    キャンセル
                  </button>
                  <button onClick={handleWithdraw}
                    disabled={withdrawLoading || !withdrawAmount || parseInt(withdrawAmount) < MIN_WITHDRAW_AMOUNT || parseInt(withdrawAmount) > balance}
                    className="px-4 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    {withdrawLoading ? '処理中...' : '出金する'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ 受注確認モーダル ═══ */}
        {confirmAcceptOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAcceptOrder(null)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#F0F0F0]">
                <h2 className="text-[15px] font-bold text-[#111]">受注確認</h2>
                <p className="text-[11px] text-[#999] mt-0.5">この案件を受注しますか？</p>
              </div>
              <div className="p-6">
                <div className="rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] p-4 mb-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[12px] text-[#666]">
                    <span className="font-semibold text-[#111]">{confirmAcceptOrder.game_title || 'Brawl Stars'}</span>
                    <span className="text-[#CCC]">/</span>
                    <span>{getServiceLabel(confirmAcceptOrder.service_type || '')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-bold text-[#111]">{confirmAcceptOrder.current_rank || '—'}</span>
                    <i className="ri-arrow-right-s-line text-[13px] text-[#CCC]"></i>
                    <span className="text-[16px] font-bold text-[#111]">{confirmAcceptOrder.target_rank || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
                    <span className="text-[11px] text-[#888]">報酬額</span>
                    <span className="text-[15px] font-bold text-[#059669]">¥{Math.floor((confirmAcceptOrder.price || 0) * EMPLOYEE_RATE).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-[#FFFBEB] border border-[#FCD34D]/40 mb-4">
                  <i className="ri-error-warning-line text-[13px] text-[#D97706] mt-0.5 shrink-0"></i>
                  <span className="text-[11px] text-[#92400E]">受注後のキャンセルは原則できません。対応可能な場合のみ受注してください。</span>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button onClick={() => setConfirmAcceptOrder(null)}
                    className="px-4 py-2 text-[12px] font-semibold text-[#666] rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                    キャンセル
                  </button>
                  <button onClick={handleAcceptConfirmed}
                    className="px-4 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors cursor-pointer">
                    受注する
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ 紛争モーダル ═══ */}
        {showDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDispute(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#F0F0F0]">
                <h2 className="text-[15px] font-bold text-[#111]">問題を報告する</h2>
                <p className="text-[11px] text-[#999] mt-0.5">管理者が内容を確認し対応します</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">理由</label>
                  <select className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
                    value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}>
                    <option value="">選択してください</option>
                    <option value="依頼者と連絡が取れない">依頼者と連絡が取れない</option>
                    <option value="依頼内容が不明確">依頼内容が不明確</option>
                    <option value="アカウントにログインできない">アカウントにログインできない</option>
                    <option value="作業を継続できない理由がある">作業を継続できない理由がある</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">詳細（任意）</label>
                  <textarea className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors resize-none placeholder:text-[#CCC]"
                    rows={4} placeholder="状況を詳しく説明してください" value={disputeDesc} onChange={(e) => setDisputeDesc(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2.5 pt-1">
                  <button onClick={() => { setShowDispute(false); setDisputeReason(''); setDisputeDesc(''); }}
                    className="px-4 py-2 text-[12px] font-semibold text-[#666] rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                    キャンセル
                  </button>
                  <button onClick={handleCreateDispute} disabled={!disputeReason || disputeLoading}
                    className="px-4 py-2 text-[12px] font-semibold bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    {disputeLoading ? '送信中...' : '報告する'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
