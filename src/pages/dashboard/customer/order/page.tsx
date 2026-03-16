import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { calcRankedPrice, calcTrophyPrice } from '../../../../lib/pricing';
import type { BrawlerStrength } from '../../../../data/brawlers';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

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
  // バックエンドの表記揺れを吸収
  if (s === 'canceled') return 'cancelled';
  if (s === 'paid_unassigned') return 'paid';
  if (s === 'claimed') return 'assigned';
  if (s === 'delivered') return 'completed';
  return s;
}

const SERVICE_TYPES: Record<string, string> = {
  'rank':         'ガチバトル上げ',
  'trophy':       'トロフィー上げ',
  'trophy-push':  'トロフィー上げ',
  'rank-push':    'ランク上げ',
  'championship': 'チャンピオンシップ',
  'daily-quest':  'デイリークエスト',
  'event-clear':  'イベントクリア',
};

const STEPS = [
  { label: '決済', min: 10 },
  { label: '受注', min: 40 },
  { label: '作業中', min: 60 },
  { label: '完了', min: 80 },
  { label: '確認', min: 100 },
];

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');

  const [showRating, setShowRating] = useState(false);
  const [ratingScore, setRatingScore] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);

  useEffect(() => {
    if (user && orderId) fetchOrder();
  }, [user, orderId]);

  const fetchOrder = async () => {
    if (!user || !orderId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, chat_threads:chat_threads(id)')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();
      if (error) throw new Error('注文が見つかりません');
      const thread = Array.isArray(data.chat_threads) ? data.chat_threads[0] : data.chat_threads;
      setChatThreadId(thread?.id ?? null);
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!order) return;
    if (!window.confirm('代行が完了したことを確認しますか？\n\n※ 確認すると代行者に報酬が支払われます。')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('confirm-order', {
        body: { order_id: order.id },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.data?.success) {
        setOrder((prev: any) => ({ ...prev, status: 'confirmed', is_paid_out: true }));
        if (order.employee_id) {
          setRatingScore(null);
          setRatingComment('');
          setShowRating(true);
        }
      } else { throw new Error(res.data?.error || '完了確認に失敗しました'); }
    } catch (err: any) { alert('完了確認に失敗しました: ' + err.message); }
  };

  const handleCreateDispute = async () => {
    if (!order || !disputeReason) return;
    if (!window.confirm('紛争として報告しますか？')) return;
    const { error } = await supabase.from('disputes').insert({
      order_id: order.id, customer_id: user?.id, employee_id: order.employee_id || null,
      status: 'open', reason: disputeReason, description: disputeDesc,
    });
    if (error) alert('紛争作成に失敗: ' + error.message);
    else alert('問題を報告しました。管理者が確認します。');
    setShowDispute(false); setDisputeReason(''); setDisputeDesc('');
  };

  const handleSubmitRating = async () => {
    if (!user || !order || !ratingScore) return;
    if (!order.employee_id) { alert('代行者が割り当てられていないため評価できません。'); setShowRating(false); return; }
    if (!ratingComment.trim()) { alert('コメントを入力してください。'); return; }
    setRatingSaving(true);
    try {
      const { error } = await supabase.from('ratings').insert({
        order_id: order.id, employee_id: order.employee_id,
        user_id: user.id, score: ratingScore, comment: ratingComment.trim(),
      });
      if (error) throw error;
      setShowRating(false);
      await fetchOrder();
    } catch (e: any) {
      alert('評価の送信に失敗しました: ' + (e.message || '不明なエラー'));
    } finally { setRatingSaving(false); }
  };

  /** notesから料金内訳・注文パラメータを再計算 */
  const orderDetails = useMemo(() => {
    if (!order) return null;
    const currentVal = Number(order.current_rank);
    const targetVal = Number(order.target_rank);
    if (isNaN(currentVal) || isNaN(targetVal) || targetVal <= currentVal) return null;

    const notes: string = order.notes || '';

    if (order.service_type === 'rank') {
      const p11Match = notes.match(/ハイチャ解放×(\d+)体/);
      const bufMatch = notes.match(/バフィー3つ解放×(\d+)体/);
      const power11 = p11Match ? Number(p11Match[1]) : 0;
      const buffy = bufMatch ? Number(bufMatch[1]) : 0;
      const pricing = calcRankedPrice(currentVal, targetVal, power11, buffy);
      return { ...pricing, type: 'rank' as const, power11, buffy };
    }

    if (order.service_type === 'trophy') {
      const strMatch = notes.match(/（(強い|普通|弱い)）/);
      const nameMatch = notes.match(/キャラ: (.+?)（/);
      const strengthLabels: Record<string, string> = { '強い': '強い', '普通': '普通', '弱い': '弱い' };
      const strengthMap: Record<string, BrawlerStrength> = { '強い': 'strong', '普通': 'normal', '弱い': 'weak' };
      const strengthJa = strMatch ? strMatch[1] : '普通';
      const strength: BrawlerStrength = strengthMap[strengthJa] || 'normal';
      const brawlerName = nameMatch ? nameMatch[1] : null;
      const pricing = calcTrophyPrice(currentVal, targetVal, strength);
      return { ...pricing, type: 'trophy' as const, brawlerName, strengthJa };
    }

    return null;
  }, [order]);

  const isTerminal = (status: string) =>
    ['cancelled', 'disputed', 'refunded'].includes(normalizeStatus(status));

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['customer', 'client', 'admin']}>
        <div className="min-h-screen bg-[#FAFAFA]">
          <Header />
          <div className="pt-[72px]">
            <div className="max-w-3xl mx-auto px-6 py-20 text-center">
              <div className="relative w-8 h-8 mx-auto mb-3">
                <div className="absolute inset-0 border-2 border-[#E5E5E5] rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-[#111] rounded-full animate-spin" />
              </div>
              <p className="text-[12px] text-[#999]">読み込み中...</p>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !order) {
    return (
      <ProtectedRoute allowedRoles={['customer', 'client', 'admin']}>
        <div className="min-h-screen bg-[#FAFAFA]">
          <Header />
          <div className="pt-[72px]">
            <div className="max-w-3xl mx-auto px-6 py-20 text-center">
              <i className="ri-error-warning-line text-2xl text-[#DC2626] mb-3 block"></i>
              <p className="text-[14px] font-semibold text-[#111] mb-1.5">{error || '注文が見つかりません'}</p>
              <button onClick={() => navigate('/dashboard/customer')}
                className="mt-4 px-5 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] cursor-pointer transition-colors">
                注文履歴に戻る
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  const s = STATUS[order.status] || fallbackStatus;
  const svcLabel = SERVICE_TYPES[order.service_type] || '代行';
  const terminal = isTerminal(order.status);
  const currentStepIdx = STEPS.findIndex(step => s.progress < step.min);
  const activeIdx = currentStepIdx === -1 ? STEPS.length - 1 : Math.max(0, currentStepIdx - 1);

  const ns = normalizeStatus(order.status);
  const chatVisible = chatThreadId && ['paid', 'payment_pending', 'assigned', 'in_progress', 'completed', 'confirmed'].includes(ns);
  const canConfirm = ns === 'completed' && !order.is_paid_out;
  const canDispute = ['paid', 'assigned', 'in_progress', 'completed'].includes(ns);

  const createdAt = new Date(order.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const updatedAt = order.updated_at
    ? new Date(order.updated_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <ProtectedRoute allowedRoles={['customer', 'client', 'admin']}>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Header />

        <div className="pt-[72px]">
          {/* Back nav */}
          <div className="border-b border-[#E5E5E5] bg-white">
            <div className="max-w-3xl mx-auto px-6 py-3">
              <button onClick={() => navigate('/dashboard/customer')}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[#888] hover:text-[#111] transition-colors cursor-pointer">
                <i className="ri-arrow-left-s-line text-[14px]"></i>
                注文履歴に戻る
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 py-6">
            {/* Step indicator */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-5 mb-4">
              {!terminal ? (
                <div className="flex items-center">
                  {STEPS.map((step, i) => {
                    const reached = s.progress >= step.min;
                    const isCurrent = i === activeIdx;
                    return (
                      <div key={step.label} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                        <div className="flex flex-col items-center gap-1.5" style={{ minWidth: '48px' }}>
                          <div
                            className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{
                              background: reached ? s.color : '#F0F0F0',
                              color: reached ? '#fff' : '#CCC',
                              boxShadow: isCurrent ? `0 0 0 3px ${s.color}20` : 'none',
                            }}
                          >
                            {reached ? <i className="ri-check-line text-[11px]"></i> : (i + 1)}
                          </div>
                          <span className="text-[10px] font-medium"
                            style={{ color: reached ? '#333' : '#CCC' }}>
                            {step.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className="flex-1 h-[2px] mx-1.5 rounded-full"
                            style={{ background: s.progress >= STEPS[i + 1].min ? s.color : '#F0F0F0' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[13px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                </div>
              )}
            </div>

            {/* Main info */}
            <div className="bg-white rounded-lg border border-[#E5E5E5] p-5 mb-4">
              <div className="flex items-center gap-1.5 mb-4 text-[12px] text-[#888]">
                <span className="font-semibold text-[#111]">{order.game_title || 'Brawl Stars'}</span>
                <span className="text-[#CCC]">/</span>
                <span>{svcLabel}</span>
              </div>

              {/* Rank */}
              <div className="flex items-center gap-3 mb-5">
                <div className="text-center">
                  <p className="text-[10px] font-medium text-[#999] mb-1">現在</p>
                  <p className="text-[22px] font-bold text-[#111]">{order.current_rank || '—'}</p>
                </div>
                <i className="ri-arrow-right-line text-[16px] text-[#CCC] mt-3"></i>
                <div className="text-center">
                  <p className="text-[10px] font-medium text-[#999] mb-1">目標</p>
                  <p className="text-[22px] font-bold text-[#111]">{order.target_rank || '—'}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F0F0F0]">
                <div>
                  <p className="text-[10px] font-medium text-[#999] mb-0.5">ステータス</p>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: s.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#999] mb-0.5">代行者</p>
                  <p className="text-[12px] font-medium text-[#333]">
                    {order.employee_id ? '割当済' : '未割当'}
                  </p>
                </div>
                {orderDetails?.type === 'rank' && (
                  <>
                    <div>
                      <p className="text-[10px] font-medium text-[#999] mb-0.5">ハイチャ解放</p>
                      <p className="text-[12px] font-medium text-[#333]">{orderDetails.power11}体</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[#999] mb-0.5">バフィー3つ解放</p>
                      <p className="text-[12px] font-medium text-[#333]">{orderDetails.buffy}体</p>
                    </div>
                  </>
                )}
                {orderDetails?.type === 'trophy' && (
                  <>
                    {orderDetails.brawlerName && (
                      <div>
                        <p className="text-[10px] font-medium text-[#999] mb-0.5">キャラ</p>
                        <p className="text-[12px] font-medium text-[#333]">{orderDetails.brawlerName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-medium text-[#999] mb-0.5">キャラ強度</p>
                      <p className="text-[12px] font-medium text-[#333]">{orderDetails.strengthJa}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-[10px] font-medium text-[#999] mb-0.5">注文日時</p>
                  <p className="text-[12px] font-medium text-[#333]">{createdAt}</p>
                </div>
                {updatedAt && (
                  <div>
                    <p className="text-[10px] font-medium text-[#999] mb-0.5">最終更新</p>
                    <p className="text-[12px] font-medium text-[#333]">{updatedAt}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-[10px] font-medium text-[#999] mb-0.5">注文ID</p>
                  <p className="text-[11px] font-mono text-[#999] truncate">{order.id}</p>
                </div>
              </div>

              {/* Price breakdown */}
              {orderDetails && orderDetails.breakdown.length > 0 && (
                <div className="pt-4 mt-4 border-t border-[#F0F0F0]">
                  <p className="text-[10px] font-medium text-[#999] mb-2.5">料金内訳</p>
                  <div className="space-y-1.5">
                    {orderDetails.breakdown.map((seg, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-[12px] text-[#555]">
                          {seg.from.toLocaleString()} → {seg.to.toLocaleString()}
                        </span>
                        <span className="text-[12px] font-semibold text-[#111]">¥{seg.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[#E5E5E5]">
                    <span className="text-[12px] font-semibold text-[#333]">合計</span>
                    <span className="text-[15px] font-bold text-[#111]">¥{orderDetails.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {(chatVisible || canConfirm || canDispute) && (
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-5 mb-4">
                <p className="text-[11px] font-medium text-[#999] mb-3">アクション</p>
                <div className="flex flex-wrap gap-2">
                  {chatVisible && (
                    <button onClick={() => navigate(`/chat/${chatThreadId}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg cursor-pointer bg-[#111] text-white hover:bg-[#333] transition-colors">
                      <i className="ri-message-3-line text-[12px]"></i>チャットを開く
                    </button>
                  )}
                  {canConfirm && (
                    <button onClick={handleConfirmComplete}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg cursor-pointer bg-[#059669] text-white hover:bg-[#047857] transition-colors">
                      <i className="ri-check-double-line text-[12px]"></i>完了を確認する
                    </button>
                  )}
                  {canDispute && (
                    <button onClick={() => setShowDispute(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg cursor-pointer text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEF2F2] transition-colors">
                      <i className="ri-alarm-warning-line text-[12px]"></i>問題を報告する
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

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
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-[#F0F0F0]">
                <h2 className="text-[15px] font-bold text-[#111]">評価を送信</h2>
                <p className="text-[11px] text-[#999] mt-0.5">代行者への満足度を教えてください</p>
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
