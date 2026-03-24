import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';
import ProtectedRoute from '../../../components/base/ProtectedRoute';

/* ── Scroll-reveal hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Status config ── */
const STATUS: Record<string, { label: string; color: string; progress: number }> = {
  DRAFT:            { label: '下書き',       color: '#9CA3AF', progress: 0 },
  PAYMENT_PENDING:  { label: '決済待ち',     color: '#D97706', progress: 10 },
  PAID_UNASSIGNED:  { label: '受注待ち',     color: '#2563EB', progress: 20 },
  paid:             { label: '支払済',       color: '#059669', progress: 20 },
  open:             { label: '募集中',       color: '#2563EB', progress: 25 },
  CLAIMED:          { label: '受注済',       color: '#2563EB', progress: 40 },
  assigned:         { label: '受注済',       color: '#2563EB', progress: 40 },
  IN_PROGRESS:      { label: '進行中',       color: '#D97706', progress: 60 },
  in_progress:      { label: '進行中',       color: '#D97706', progress: 60 },
  DELIVERED:        { label: '納品済',       color: '#059669', progress: 80 },
  completed:        { label: '完了',         color: '#059669', progress: 80 },
  COMPLETED:        { label: '完了',         color: '#059669', progress: 80 },
  confirmed:        { label: '確認済',       color: '#059669', progress: 100 },
  CONFIRMED:        { label: '確認済',       color: '#059669', progress: 100 },
  CANCELED:         { label: 'キャンセル',   color: '#DC2626', progress: 0 },
  cancelled:        { label: 'キャンセル',   color: '#DC2626', progress: 0 },
  DISPUTED:         { label: '異議申立中',   color: '#DC2626', progress: 0 },
  REFUNDED:         { label: '返金済',       color: '#9CA3AF', progress: 0 },
  pending:          { label: '保留中',       color: '#D97706', progress: 10 },
};
const fallbackStatus = { label: '不明', color: '#9CA3AF', progress: 0 };

/** ステータスを小文字に正規化 */
function normalizeStatus(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'canceled') return 'cancelled';
  if (s === 'paid_unassigned') return 'paid';
  if (s === 'claimed') return 'assigned';
  if (s === 'delivered') return 'completed';
  return s;
}

/* ── Service type config ── */
const SERVICE_TYPES: Record<string, { label: string; icon: string }> = {
  'rank':         { label: 'ガチバトル上げ', icon: 'ri-sword-line' },
  'trophy':       { label: 'トロフィー上げ', icon: 'ri-trophy-line' },
  'trophy-push':  { label: 'トロフィー上げ', icon: 'ri-trophy-line' },
  'rank-push':    { label: 'ランク上げ',     icon: 'ri-vip-crown-line' },
  'championship': { label: 'チャンピオンシップ', icon: 'ri-sword-line' },
  'daily-quest':  { label: 'デイリークエスト', icon: 'ri-calendar-check-line' },
  'event-clear':  { label: 'イベントクリア', icon: 'ri-flashlight-line' },
};
const fallbackService = { label: '代行', icon: 'ri-gamepad-line' };

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const [showDispute, setShowDispute] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmModalOrder, setConfirmModalOrder] = useState<any | null>(null);

  const [showRating, setShowRating] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [ratingWorkerId, setRatingWorkerId] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const listReveal = useReveal(0.05);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoadingTimeout(true), 10000);
      return () => clearTimeout(timer);
    } else { setLoadingTimeout(false); }
  }, [loading]);

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setDataLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, chat_threads:chat_threads(order_id, id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) { console.error('[fetchOrders]', error); throw new Error('注文の取得に失敗しました'); }
      const ordersWithChatId = (data || []).map((order: any) => {
        const thread = Array.isArray(order.chat_threads) ? order.chat_threads[0] : order.chat_threads;
        return { ...order, chat_thread_id: thread?.id ?? null };
      });
      const chatEligibleStatuses = ['paid', 'payment_pending', 'assigned', 'in_progress', 'completed'];
      const needThreadIds = ordersWithChatId.filter(
        (o) => !o.chat_thread_id && chatEligibleStatuses.includes(normalizeStatus(o.status))
      );
      if (needThreadIds.length > 0) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await supabase.functions.invoke('get-chat-thread-ids', {
            body: { order_ids: needThreadIds.map((o) => o.id) },
            headers: { Authorization: `Bearer ${session?.access_token}` },
          });
          if (res.data?.success && res.data?.data && typeof res.data.data === 'object') {
            const threadMap = res.data.data as Record<string, string>;
            ordersWithChatId.forEach((o) => {
              if (!o.chat_thread_id && threadMap[o.id]) o.chat_thread_id = threadMap[o.id];
            });
          }
        } catch (e) { console.warn('get-chat-thread-ids:', e); }
      }
      setOrders(ordersWithChatId);
    } catch (err: any) {
      setError(err.message || '注文の取得に失敗しました');
    } finally { setDataLoading(false); }
  };

  const handleConfirmComplete = async (orderId: string) => {
    if (confirmingId) return;
    setConfirmModalOrder(null);
    setConfirmingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('confirm-order', {
        body: { order_id: orderId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.data?.success) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'confirmed', is_paid_out: true } : o));
        const order = orders.find((o) => o.id === orderId);
        if (order?.employee_id) {
          setRatingOrderId(orderId);
          setRatingWorkerId(order.employee_id);
          setRatingScore(null);
          setRatingComment('');
          setShowRating(true);
        } else { await fetchOrders(); }
      } else { throw new Error(res.data?.error || '完了確認に失敗しました'); }
    } catch (err: any) { console.error('[confirm-order]', err); alert('完了確認に失敗しました。もう一度お試しください。'); } finally { setConfirmingId(null); }
  };

  const handleCreateDispute = async () => {
    if (!disputeOrderId || !disputeReason) return;
    const order = orders.find((o) => o.id === disputeOrderId);
    if (!order) return;
    if (!window.confirm('紛争として報告しますか？')) return;
    const { error } = await supabase.from('disputes').insert({
      order_id: disputeOrderId, customer_id: user?.id, employee_id: order.employee_id || null,
      status: 'open', reason: disputeReason, description: disputeDesc,
    });
    if (error) { console.error('[create-dispute]', error); alert('紛争作成に失敗しました。もう一度お試しください。'); }
    else alert('問題を報告しました。管理者が確認します。');
    setShowDispute(false); setDisputeReason(''); setDisputeDesc(''); setDisputeOrderId(null);
  };

  const handleSubmitRating = async () => {
    if (!user || !ratingOrderId || !ratingScore) return;
    if (!ratingWorkerId) { alert('代行者が割り当てられていないため評価できません。'); setShowRating(false); return; }
    if (!ratingComment.trim()) { alert('コメントを入力してください。'); return; }
    setRatingSaving(true);
    try {
      const { error } = await supabase.from('ratings').insert({
        order_id: ratingOrderId, employee_id: ratingWorkerId,
        user_id: user.id, score: ratingScore, comment: ratingComment.trim(),
      });
      if (error) throw error;
      setShowRating(false);
      await fetchOrders();
    } catch (e: any) {
      console.error('[submit-rating]', e); alert('評価の送信に失敗しました。もう一度お試しください。');
    } finally { setRatingSaving(false); }
  };

  const isTerminal = (status: string) =>
    ['cancelled', 'disputed', 'refunded'].includes(normalizeStatus(status));

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const activeStatuses = ['assigned', 'in_progress', 'paid', 'payment_pending', 'open', 'pending', 'completed'];
  const doneStatuses = ['confirmed', 'cancelled', 'disputed', 'refunded'];

  const filteredOrders = orders.filter((o) => {
    const ns = normalizeStatus(o.status);
    if (filter === 'active') return activeStatuses.includes(ns);
    if (filter === 'done') return doneStatuses.includes(ns);
    return true;
  });

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

  if (loading && loadingTimeout) {
    return (
      <ProtectedRoute allowedRoles={['customer', 'admin']}>
        <div className="min-h-screen bg-white">
          <Header />
          <div className="max-w-3xl mx-auto px-6 pt-32 pb-20 text-center">
            <i className="ri-error-warning-line text-2xl text-[#DC2626] mb-4 block"></i>
            <h2 className="text-base font-bold text-[#111] mb-2">読み込みに失敗しました</h2>
            <p className="text-[13px] text-[#666] mb-6">ページを再読み込みしてください。</p>
            <button onClick={() => window.location.reload()}
              className="px-5 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors cursor-pointer">
              再読み込み
            </button>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['customer', 'admin']}>
      <div className="min-h-screen bg-[#FAFAFA]">
        <style>{`
          @keyframes mc-fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes mc-spin { to { transform: rotate(360deg); } }
          @keyframes mc-progressFill { from { width: 0%; } }
          @keyframes mc-dotPop {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.25); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes mc-lineFill {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          @keyframes mc-currentPulse {
            0%, 100% { box-shadow: 0 0 0 3px var(--pulse-color, rgba(0,0,0,0.08)); }
            50% { box-shadow: 0 0 0 6px var(--pulse-color, rgba(0,0,0,0.04)); }
          }
          @keyframes mc-labelFadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .mc-order-card {
            transition: border-color 0.2s ease;
          }
          @media (hover: hover) {
            .mc-order-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
              border-color: #CCC !important;
              transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.2s ease;
            }
          }
          .mc-order-card:active {
            transform: scale(0.99);
          }
        `}</style>

        <Header />

        {/* ═══ Header ═══ */}
        <section className="pt-[72px] border-b border-[#E5E5E5] bg-white">
          <div className="max-w-3xl mx-auto px-6 pt-5 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-bold text-[#111] tracking-tight">注文履歴</h1>
                <p className="text-[13px] text-[#888] mt-1">依頼の進捗をここで確認できます</p>
              </div>
              {!dataLoading && !error && (
                <button onClick={handleRefresh} disabled={refreshing}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#888] hover:text-[#111] hover:bg-[#F5F5F5] transition-colors cursor-pointer disabled:opacity-40">
                  <i className={`ri-refresh-line text-[16px] ${refreshing ? 'animate-spin' : ''}`}></i>
                </button>
              )}
            </div>

            {!dataLoading && !error && orders.length > 0 && (
              <div className="flex gap-1 mt-5">
                {([
                  { key: 'all' as const, label: 'すべて', count: orders.length },
                  { key: 'active' as const, label: '進行中', count: orders.filter(o => activeStatuses.includes(normalizeStatus(o.status))).length },
                  { key: 'done' as const, label: '完了済', count: orders.filter(o => doneStatuses.includes(normalizeStatus(o.status))).length },
                ]).map((tab) => (
                  <button key={tab.key} onClick={() => setFilter(tab.key)}
                    className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-full transition-colors cursor-pointer ${
                      filter === tab.key
                        ? 'bg-[#111] text-white'
                        : 'text-[#888] hover:bg-[#F5F5F5] hover:text-[#111]'
                    }`}>
                    {tab.label}
                    <span className={`ml-1.5 text-[11px] ${filter === tab.key ? 'text-white/60' : 'text-[#CCC]'}`}>{tab.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ═══ Content ═══ */}
        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-6 pt-6" ref={listReveal.ref}>

            {dataLoading && (
              <div className="py-20 text-center">
                <div className="relative w-8 h-8 mx-auto mb-3">
                  <div className="absolute inset-0 border-2 border-[#E5E5E5] rounded-full" />
                  <div className="absolute inset-0 border-2 border-transparent border-t-[#111] rounded-full"
                    style={{ animation: 'mc-spin 0.7s linear infinite' }} />
                </div>
                <p className="text-[12px] text-[#999]">読み込み中...</p>
              </div>
            )}

            {!dataLoading && error && (
              <div className="py-16 text-center">
                <i className="ri-error-warning-line text-2xl text-[#DC2626] mb-3 block"></i>
                <p className="text-[14px] font-semibold text-[#111] mb-1.5">取得に失敗しました</p>
                <p className="text-[12px] text-[#888] mb-5">{error}</p>
                <button onClick={fetchOrders}
                  className="px-5 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] cursor-pointer transition-colors">
                  再試行
                </button>
              </div>
            )}

            {!dataLoading && !error && orders.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-[#F5F5F5] mx-auto mb-4 flex items-center justify-center">
                  <i className="ri-gamepad-line text-xl text-[#999]"></i>
                </div>
                <p className="text-[15px] font-semibold text-[#111] mb-1.5">依頼はまだありません</p>
                <p className="text-[13px] text-[#888] mb-6">プロのゲーマーにランク代行を任せましょう</p>
                <button onClick={() => navigate('/games')}
                  className="px-6 py-2.5 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] cursor-pointer transition-colors">
                  依頼を作成する<i className="ri-arrow-right-line ml-1.5"></i>
                </button>
              </div>
            )}

            {/* ═══ Order Cards ═══ */}
            {!dataLoading && !error && orders.length > 0 && filteredOrders.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-[13px] text-[#999]">該当する注文はありません</p>
              </div>
            )}
            {!dataLoading && !error && filteredOrders.length > 0 && (
              <div className="space-y-3">
                {filteredOrders.map((order, idx) => {
                  const s = STATUS[order.status] || fallbackStatus;
                  const svc = SERVICE_TYPES[order.service_type] || fallbackService;
                  const terminal = isTerminal(order.status);

                  const ns = normalizeStatus(order.status);
                  const chatVisible = order.chat_thread_id && ['paid', 'payment_pending', 'assigned', 'in_progress', 'completed', 'confirmed'].includes(ns);
                  const canConfirm = ns === 'completed' && !order.is_paid_out;
                  const canDispute = false; // 詳細ページのみで表示
                  const dateStr = new Date(order.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

                  const STEPS = [
                    { label: '決済', min: 10 },
                    { label: '受注', min: 40 },
                    { label: '作業中', min: 60 },
                    { label: '完了', min: 80 },
                    { label: '確認', min: 100 },
                  ];

                  const currentStepIdx = STEPS.findIndex(step => s.progress < step.min);
                  const activeIdx = currentStepIdx === -1 ? STEPS.length - 1 : Math.max(0, currentStepIdx - 1);

                  return (
                    <div
                      key={order.id}
                      className="mc-order-card rounded-lg bg-white border border-[#E5E5E5] overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/dashboard/customer/order/${order.id}`)}
                      style={{
                        opacity: listReveal.visible ? 1 : 0,
                        animation: listReveal.visible
                          ? `mc-fadeUp 0.35s ease ${0.04 * idx}s both`
                          : 'none',
                      }}
                    >
                      <div className="p-4 sm:p-5">
                        {/* Step indicator */}
                        {!terminal ? (
                          <div className="flex items-center mb-4">
                            {STEPS.map((step, i) => {
                              const reached = s.progress >= step.min;
                              const isCurrent = i === activeIdx;
                              return (
                                <div key={step.label} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                                  {/* Dot + label */}
                                  <div className="flex flex-col items-center gap-1" style={{ minWidth: '40px' }}>
                                    <div
                                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold"
                                      style={{
                                        background: reached ? s.color : '#F0F0F0',
                                        color: reached ? '#fff' : '#CCC',
                                        animation: reached
                                          ? `mc-dotPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.15 * i}s both`
                                          : 'none',
                                        ...(isCurrent ? { '--pulse-color': `${s.color}20`, animation: `mc-dotPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.15 * i}s both, mc-currentPulse 2s ease-in-out ${0.15 * i + 0.4}s infinite` } as any : {}),
                                      }}
                                    >
                                      {reached ? <i className="ri-check-line text-[10px]"></i> : (i + 1)}
                                    </div>
                                    <span className="text-[9px] font-medium leading-none"
                                      style={{
                                        color: reached ? '#333' : isCurrent ? '#666' : '#CCC',
                                        animation: `mc-labelFadeIn 0.3s ease ${0.15 * i + 0.1}s both`,
                                      }}>
                                      {step.label}
                                    </span>
                                  </div>
                                  {/* Connecting line */}
                                  {i < STEPS.length - 1 && (
                                    <div className="flex-1 h-[2px] mx-1 rounded-full overflow-hidden" style={{ background: '#F0F0F0' }}>
                                      {s.progress >= STEPS[i + 1].min && (
                                        <div className="h-full rounded-full" style={{
                                          background: s.color,
                                          transformOrigin: 'left',
                                          animation: `mc-lineFill 0.4s ease ${0.15 * i + 0.2}s both`,
                                        }} />
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mb-4 px-2.5 py-1.5 rounded-md" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                            <span className="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                          </div>
                        )}

                        {/* Game + Service */}
                        <div className="flex items-center gap-1.5 mb-2 text-[12px] text-[#666]">
                          <span className="font-semibold text-[#111]">{order.game_title || 'Brawl Stars'}</span>
                          <span className="text-[#CCC]">/</span>
                          <span>{svc.label}</span>
                        </div>

                        {/* Rank + Price */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[16px] font-bold text-[#111]">
                              {order.current_rank || '—'}
                            </span>
                            <i className="ri-arrow-right-s-line text-[13px] text-[#CCC]"></i>
                            <span className="text-[16px] font-bold text-[#111]">
                              {order.target_rank || '—'}
                            </span>
                          </div>
                          <span className="text-[14px] font-bold text-[#111] shrink-0">
                            ¥{(order.price || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2">
                          {order.employee_id && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-[#059669] bg-[#F0FDF4]">
                              <i className="ri-user-star-line text-[10px]"></i>
                              代行者割当済
                            </span>
                          )}
                          <span className="text-[10px] text-[#BBB] ml-auto">{dateStr}</span>
                        </div>

                        {/* Actions */}
                        {(chatVisible || canConfirm || canDispute) && (
                          <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-[#F0F0F0]" onClick={(e) => e.stopPropagation()}>
                            {chatVisible && (
                              <button onClick={() => navigate(`/chat/${order.chat_thread_id}`)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer text-[#111] border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors">
                                <i className="ri-message-3-line text-[11px]"></i>チャット
                              </button>
                            )}
                            {canConfirm && (
                              <button onClick={() => setConfirmModalOrder(order)} disabled={confirmingId === order.id}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer bg-[#059669] text-white hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {confirmingId === order.id ? <><i className="ri-loader-4-line text-[11px] animate-spin"></i>処理中...</> : <><i className="ri-check-double-line text-[11px]"></i>完了を確認</>}
                              </button>
                            )}
                            {canDispute && (
                              <button onClick={() => { setDisputeOrderId(order.id); setShowDispute(true); }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-md cursor-pointer text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEF2F2] transition-colors">
                                <i className="ri-alarm-warning-line text-[11px]"></i>問題を報告する
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ═══ Confirm Complete Modal ═══ */}
        {confirmModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmModalOrder(null)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#F0F0F0]">
                <h2 className="text-[15px] font-bold text-[#111]">完了確認</h2>
              </div>
              <div className="p-6">
                <div className="bg-[#F7F9F9] rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-1.5 mb-2 text-[12px] text-[#888]">
                    <span className="font-semibold text-[#111]">{confirmModalOrder.game_title || 'Brawl Stars'}</span>
                    <span className="text-[#CCC]">/</span>
                    <span>{(SERVICE_TYPES[confirmModalOrder.service_type] || fallbackService).label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] font-bold text-[#111]">
                    <span>{confirmModalOrder.current_rank || '—'}</span>
                    <i className="ri-arrow-right-line text-[12px] text-[#CCC]"></i>
                    <span>{confirmModalOrder.target_rank || '—'}</span>
                  </div>
                  <p className="text-[12px] font-semibold text-[#111] mt-2">
                    お支払い額: ¥{(confirmModalOrder.price || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-4 py-3 mb-5">
                  <div className="flex items-start gap-2">
                    <i className="ri-error-warning-fill text-[14px] text-[#F59E0B] mt-0.5 shrink-0"></i>
                    <p className="text-[12px] text-[#92400E]">
                      確認すると代行者に報酬が支払われます。作業内容に問題がないことを確認してください。
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button onClick={() => setConfirmModalOrder(null)}
                    className="px-4 py-2 text-[12px] font-semibold text-[#666] rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                    キャンセル
                  </button>
                  <button onClick={() => handleConfirmComplete(confirmModalOrder.id)} disabled={!!confirmingId}
                    className="px-4 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-40">
                    {confirmingId ? '処理中...' : '完了を確認する'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Dispute Modal ═══ */}
        {showDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDispute(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}>
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
                    <option value="作業が進まない">作業が進まない</option>
                    <option value="代行者と連絡が取れない">代行者と連絡が取れない</option>
                    <option value="作業内容が依頼と異なる">作業内容が依頼と異なる</option>
                    <option value="アカウントに問題が発生した">アカウントに問題が発生した</option>
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
                  <button onClick={handleCreateDispute} disabled={!disputeReason}
                    className="px-4 py-2 text-[12px] font-semibold bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    報告する
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Rating Modal ═══ */}
        {showRating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowRating(false)} />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-bold text-[#111]">評価を送信</h2>
                  <p className="text-[11px] text-[#999] mt-0.5">代行者への満足度を教えてください</p>
                </div>
                <button onClick={() => setShowRating(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors cursor-pointer text-[#999]">
                  <i className="ri-close-line text-[18px]"></i>
                </button>
              </div>
              <div className="p-6">
                <div className="mb-5">
                  <p className="text-[11px] font-semibold text-[#666] mb-2">満足度</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRatingScore(star)}
                        className="w-10 h-10 flex items-center justify-center text-[22px] transition-all duration-150 cursor-pointer"
                        style={{
                          color: ratingScore && ratingScore >= star ? '#FBBF24' : '#D1D5DB',
                        }}>★</button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#BBB] mt-1.5">1: かなり不満 / 2: やや不満 / 3: 普通 / 4: 満足 / 5: とても満足</p>
                </div>
                <div className="mb-5">
                  <p className="text-[11px] font-semibold text-[#666] mb-1.5">コメント</p>
                  <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} rows={3}
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors resize-none placeholder:text-[#CCC]"
                    placeholder="良かった点・気になった点など" />
                </div>
                <button type="button" onClick={handleSubmitRating}
                  disabled={ratingSaving || !ratingScore || !ratingComment.trim()}
                  className="w-full py-2.5 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  {ratingSaving ? '送信中...' : '評価を送信する'}
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
