import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabase';
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
  completed:        { label: '完了報告済',   color: '#059669', progress: 80 },
  COMPLETED:        { label: '完了報告済',   color: '#059669', progress: 80 },
  confirmed:        { label: '確認済',       color: '#059669', progress: 100 },
  CONFIRMED:        { label: '確認済',       color: '#059669', progress: 100 },
  CANCELED:         { label: 'キャンセル',   color: '#DC2626', progress: 0 },
  cancelled:        { label: 'キャンセル',   color: '#DC2626', progress: 0 },
  DISPUTED:         { label: '異議申立中',   color: '#DC2626', progress: 0 },
  REFUNDED:         { label: '返金済',       color: '#9CA3AF', progress: 0 },
  pending:          { label: '保留中',       color: '#D97706', progress: 10 },
};
const fallbackStatus = { label: '不明', color: '#9CA3AF', progress: 0 };

/** プラットフォーム手数料率（payout-employee/confirm-orderのsystem_settingsと合わせる） */
const PLATFORM_FEE_RATE = 0.20;
const EMPLOYEE_RATE = 1 - PLATFORM_FEE_RATE;

const SERVICE_TYPES: Record<string, string> = {
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

export default function EmployeeOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

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
        .select('*')
        .eq('id', orderId)
        .eq('employee_id', user.id)
        .single();
      if (error) throw new Error('注文が見つかりません');
      setOrder(data);

      // チャットスレッドID取得
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke('get-chat-thread-ids', {
          body: { order_ids: [orderId] },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.data?.success && res.data?.data?.[orderId]) {
          setChatThreadId(res.data.data[orderId]);
        }
      } catch (_) {
        const { data: threads } = await supabase
          .from('chat_threads')
          .select('id')
          .eq('order_id', orderId)
          .limit(1);
        if (threads?.[0]) setChatThreadId(threads[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user?.id || !order) return;
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('update-order-status', {
        body: { order_id: order.id, status: newStatus },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw new Error(res.error.message || '更新に失敗しました');
      if (!res.data?.success) throw new Error(res.data?.error || '更新に失敗しました');
      await fetchOrder();
    } catch (err: any) {
      alert('更新に失敗しました: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!order || !disputeReason || disputeLoading) return;
    if (!window.confirm('紛争として報告しますか？\n\n管理者が内容を確認し対応します。')) return;
    setDisputeLoading(true);
    try {
      const { error } = await supabase.from('disputes').insert({
        order_id: order.id, customer_id: order.user_id, employee_id: user?.id,
        status: 'open', reason: disputeReason, description: disputeDesc,
      });
      if (error) alert('紛争作成に失敗: ' + error.message);
      else alert('問題を報告しました。管理者が確認します。');
      setShowDispute(false); setDisputeReason(''); setDisputeDesc('');
    } finally {
      setDisputeLoading(false);
    }
  };

  const isTerminal = (status: string) =>
    ['CANCELED', 'cancelled', 'DISPUTED', 'REFUNDED'].includes(status);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['employee', 'admin']}>
        <div className="min-h-screen bg-[#FAFAFA]">
          <Header />
          <div className="pt-[72px]">
            <div className="max-w-3xl mx-auto px-6 py-20 text-center">
              <style>{`@keyframes eod-spin { to { transform: rotate(360deg); } }`}</style>
              <div className="relative w-8 h-8 mx-auto mb-3">
                <div className="absolute inset-0 border-2 border-[#E5E5E5] rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-[#111] rounded-full"
                  style={{ animation: 'eod-spin 0.7s linear infinite' }} />
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
      <ProtectedRoute allowedRoles={['employee', 'admin']}>
        <div className="min-h-screen bg-[#FAFAFA]">
          <Header />
          <div className="pt-[72px]">
            <div className="max-w-3xl mx-auto px-6 py-20 text-center">
              <i className="ri-error-warning-line text-2xl text-[#DC2626] mb-3 block"></i>
              <p className="text-[14px] font-semibold text-[#111] mb-1.5">{error || '注文が見つかりません'}</p>
              <button onClick={() => navigate('/dashboard/employee')}
                className="mt-4 px-5 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] cursor-pointer transition-colors">
                ダッシュボードに戻る
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

  const chatVisible = chatThreadId && ['assigned', 'in_progress', 'completed'].includes(order.status);
  const canStart = order.status === 'assigned';
  const canComplete = order.status === 'in_progress';

  const createdAt = new Date(order.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const updatedAt = order.updated_at
    ? new Date(order.updated_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <ProtectedRoute allowedRoles={['employee', 'admin']}>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Header />

        <div className="pt-[72px]">
          {/* Back nav */}
          <div className="border-b border-[#E5E5E5] bg-white">
            <div className="max-w-3xl mx-auto px-6 py-3">
              <button onClick={() => navigate('/dashboard/employee')}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[#888] hover:text-[#111] transition-colors cursor-pointer">
                <i className="ri-arrow-left-s-line text-[14px]"></i>
                ダッシュボードに戻る
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
                  <p className="text-[10px] font-medium text-[#999] mb-0.5">報酬</p>
                  <p className="text-[15px] font-bold text-[#059669]">¥{Math.floor((order.price || 0) * EMPLOYEE_RATE).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#999] mb-0.5">ステータス</p>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: s.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#999] mb-0.5">依頼日時</p>
                  <p className="text-[12px] font-medium text-[#333]">{createdAt}</p>
                </div>
                {updatedAt && (
                  <div>
                    <p className="text-[10px] font-medium text-[#999] mb-0.5">最終更新</p>
                    <p className="text-[12px] font-medium text-[#333]">{updatedAt}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-medium text-[#999] mb-0.5">注文ID</p>
                  <p className="text-[11px] font-mono text-[#999] truncate">{order.id}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {(canStart || canComplete || chatVisible || !terminal) && (
              <div className="bg-white rounded-lg border border-[#E5E5E5] p-5 mb-4">
                <p className="text-[11px] font-medium text-[#999] mb-3">アクション</p>
                <div className="flex flex-wrap gap-2">
                  {canStart && (
                    <button onClick={() => handleStatusChange('in_progress')} disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg cursor-pointer bg-[#D97706] text-white hover:bg-[#B45309] transition-colors disabled:opacity-40">
                      <i className="ri-play-line text-[12px]"></i>作業開始
                    </button>
                  )}
                  {canComplete && (
                    <button onClick={() => handleStatusChange('completed')} disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg cursor-pointer bg-[#059669] text-white hover:bg-[#047857] transition-colors disabled:opacity-40">
                      <i className="ri-check-double-line text-[12px]"></i>作業完了
                    </button>
                  )}
                  {chatVisible && (
                    <button onClick={() => navigate(`/chat/${chatThreadId}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg cursor-pointer bg-[#111] text-white hover:bg-[#333] transition-colors">
                      <i className="ri-message-3-line text-[12px]"></i>チャットを開く
                    </button>
                  )}
                  <button onClick={() => setShowDispute(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-lg cursor-pointer text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEF2F2] transition-colors">
                    <i className="ri-alarm-warning-line text-[12px]"></i>問題を報告する
                  </button>
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
