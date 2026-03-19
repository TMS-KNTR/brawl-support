import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, logAdminAction } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';

export default function AdminDisputesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [feeRate, setFeeRate] = useState(0.20);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<any>(null);
  const [resolveAction, setResolveAction] = useState<string>('none');
  const [resolveNote, setResolveNote] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  useEffect(() => { loadDisputes(); }, []);

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'platform_fee_rate')
      .single()
      .then(({ data }) => {
        if (data?.value != null) setFeeRate(Number(data.value));
      });
  }, []);

  async function loadDisputes() {
    setLoading(true);
    // まず紛争だけ取得
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('disputes取得エラー:', error);
      alert('紛争の取得に失敗: ' + error.message);
      setLoading(false);
      return;
    }

    // 各紛争に注文情報を個別に取得
    const enriched = await Promise.all((data || []).map(async (d: any) => {
      if (!d.order_id) return { ...d, order: null };
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, price, total_price, payment_intent_id, employee_id, user_id, is_refunded, is_paid_out')
        .eq('id', d.order_id)
        .single();

      let chatThreadId = null;
      if (orderData) {
        const { data: threads } = await supabase
          .from('chat_threads')
          .select('id')
          .eq('order_id', d.order_id)
          .limit(1);
        chatThreadId = threads?.[0]?.id || null;
      }

      return { ...d, order: orderData ? { ...orderData, chat_threads: chatThreadId ? [{ id: chatThreadId }] : [] } : null };
    }));

    setDisputes(enriched);
    setLoading(false);
  }

  async function openChat(orderId: string, existingThreadId: string | null) {
    if (existingThreadId) {
      navigate(`/chat/${existingThreadId}`);
      return;
    }
    // chat_threads が無い場合は自動作成
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .insert({ order_id: orderId })
        .select('id')
        .single();
      if (error) throw error;
      navigate(`/chat/${data.id}`);
    } catch (err: any) {
      alert('チャットスレッドの作成に失敗しました: ' + err.message);
    }
  }

  function openResolveModal(dispute: any) {
    setResolveTarget(dispute);
    setResolveAction('none');
    setResolveNote('');
    setShowResolveModal(true);
  }

  async function executeResolve() {
    if (!resolveTarget) return;

    const price = resolveTarget.order?.price || resolveTarget.order?.total_price || 0;
    const confirmMsg = resolveAction === 'refund'
      ? `依頼者に ¥${price.toLocaleString()} を返金します。実行しますか？`
      : resolveAction === 'payout'
      ? `従業員に報酬（¥${Math.floor(price * (1 - feeRate)).toLocaleString()}）を支払います。実行しますか？`
      : '金銭の移動なしで紛争を解決済みにします。実行しますか？';
    if (!window.confirm(confirmMsg)) return;

    setResolveLoading(true);

    try {
      const order = resolveTarget.order;
      const { data: { session } } = await supabase.auth.getSession();

      const orderId = order?.id || resolveTarget.order_id;
      if (!orderId) {
        throw new Error('紛争に紐づく注文IDがありません');
      }

      if (resolveAction === 'refund') {
        const res = await supabase.functions.invoke('refund-order', {
          body: { order_id: orderId },
        });
        if (res.error) throw new Error(res.error.message || '返金に失敗しました');
        let result = res.data;
        try { if (typeof result === 'string') result = JSON.parse(result); } catch { /* parse失敗はそのまま */ }
        if (!result?.success) throw new Error(result?.error || '返金に失敗しました');
      } else if (resolveAction === 'payout') {
        const res = await supabase.functions.invoke('payout-employee', {
          body: { order_id: orderId },
        });
        if (res.error) throw new Error(res.error.message || '支払いに失敗しました');
        let result = res.data;
        try { if (typeof result === 'string') result = JSON.parse(result); } catch { /* parse失敗はそのまま */ }
        if (!result?.success) throw new Error(result?.error || '支払いに失敗しました');
      }

      const newStatus = resolveAction === 'refund' ? 'resolved_refund'
        : resolveAction === 'payout' ? 'resolved_payout'
        : 'resolved_dismissed';

      const updateResult = await supabase
        .from('disputes')
        .update({
          status: newStatus,
          resolution: resolveAction,
          resolution_note: resolveNote,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', resolveTarget.id)
        .select();

      if (updateResult.error) throw new Error('紛争ステータス更新エラー: ' + updateResult.error.message);
      if (!updateResult.data || updateResult.data.length === 0) {
        throw new Error(`紛争の更新が反映されませんでした（0行更新）。ID: ${resolveTarget.id}, newStatus: ${newStatus}`);
      }

      await logAdminAction({ action: 'dispute_resolved', targetType: 'dispute', targetId: resolveTarget.id, details: `紛争を解決 (${resolveAction})`, meta: { resolution: resolveAction, resolution_note: resolveNote, order_id: orderId } });
      const actionText = resolveAction === 'refund' ? '（返金済み）' : resolveAction === 'payout' ? '（従業員に支払い済み）' : '';
      alert('✅ 紛争を解決しました' + actionText);
      setShowResolveModal(false);
      loadDisputes();
    } catch (err: any) {
      alert('❌ エラー: ' + err.message);
    }
    setResolveLoading(false);
  }

  async function closeDismiss(id: string) {
    if (!window.confirm('この紛争を却下（クローズ）しますか？')) return;
    const { error } = await supabase.from('disputes').update({
      status: 'resolved_dismissed',
      resolution: 'dismissed',
      resolution_note: '管理者により却下',
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id,
    }).eq('id', id);
    if (error) { alert('エラー: ' + error.message); return; }
    await logAdminAction({ action: 'dispute_closed', targetType: 'dispute', targetId: id, details: '紛争を却下（クローズ）', meta: {} });
    loadDisputes();
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      open: { color: 'bg-red-100 text-red-800', text: '未解決' },
      'need-more-info': { color: 'bg-yellow-100 text-yellow-800', text: '情報待ち' },
      'resolved_refund': { color: 'bg-green-100 text-green-800', text: '解決済（返金）' },
      'resolved_payout': { color: 'bg-green-100 text-green-800', text: '解決済（支払）' },
      'resolved_dismissed': { color: 'bg-gray-100 text-gray-800', text: '却下' },
      'resolved_release': { color: 'bg-green-100 text-green-800', text: '解決済' },
    };
    const cfg = map[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.text}</span>;
  };

  const getResolutionLabel = (r: string) => {
    if (r === 'refund') return '🔄 依頼者に返金';
    if (r === 'payout') return '💰 従業員に支払い';
    return '対応なし';
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/dashboard/admin')} className="text-purple-600 hover:underline text-sm mb-2 block">← 管理者ダッシュボード</button>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">⚖ 紛争管理</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-4xl mb-4">✅</p>
              <h3 className="text-xl font-semibold text-gray-900">紛争はありません</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => {
                const order = d.order;
                const price = order?.price || order?.total_price || 0;

                return (
                  <div key={d.id} className={`bg-white rounded-lg shadow-sm p-5 ${d.status === 'open' ? 'border-l-4 border-red-500' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{d.reason || '理由なし'}</p>
                          {getStatusBadge(d.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{d.description || ''}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                          <span className="font-mono">注文: {d.order_id?.slice(0, 8)}...</span>
                          {price > 0 && <span>金額: ¥{price.toLocaleString()}</span>}
                          {order?.is_refunded && <span className="text-blue-600 font-medium">返金済み</span>}
                          {order?.is_paid_out && <span className="text-green-600 font-medium">支払い済み</span>}
                        </div>

                        {d.status !== 'open' && d.resolution && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">解決内容:</span> {getResolutionLabel(d.resolution)}
                            {d.resolution_note && <span className="ml-2">/ {d.resolution_note}</span>}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{new Date(d.created_at).toLocaleDateString()}</p>
                    </div>

                    {d.status === 'open' && (
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => openResolveModal(d)} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 font-medium">✅ 解決する</button>
                        {(() => {
                          const threads = order?.chat_threads;
                          const threadId = Array.isArray(threads) ? threads[0]?.id : threads?.id;
                          return (
                            <button
                              onClick={() => openChat(d.order_id, threadId)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 font-medium"
                            >
                              ⚖ 仲裁チャット
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 解決モーダル */}
        {showResolveModal && resolveTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg p-6">
              <h2 className="text-xl font-bold mb-2">⚖ 紛争を解決する</h2>
              <p className="text-sm text-gray-600 mb-4">理由: {resolveTarget.reason}</p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <p>注文ID: <span className="font-mono">{resolveTarget.order_id?.slice(0, 8)}...</span></p>
                <p>金額: <span className="font-bold">¥{(resolveTarget.order?.price || resolveTarget.order?.total_price || 0).toLocaleString()}</span></p>
                {resolveTarget.order?.is_refunded && <p className="text-blue-600">※ 既に返金済み</p>}
                {resolveTarget.order?.is_paid_out && <p className="text-green-600">※ 既に従業員に支払い済み</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">解決時のアクション</label>
                <div className="space-y-2">
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${resolveAction === 'refund' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="action" value="refund" checked={resolveAction === 'refund'} onChange={() => setResolveAction('refund')} className="mr-3" disabled={resolveTarget.order?.is_refunded} />
                    <div>
                      <p className="font-medium text-gray-900">🔄 依頼者に全額返金</p>
                      <p className="text-xs text-gray-500">Stripeから依頼者に返金します{resolveTarget.order?.is_refunded ? '（返金済み）' : ''}</p>
                    </div>
                  </label>

                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${resolveAction === 'payout' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="action" value="payout" checked={resolveAction === 'payout'} onChange={() => setResolveAction('payout')} className="mr-3" disabled={resolveTarget.order?.is_paid_out} />
                    <div>
                      <p className="font-medium text-gray-900">💰 従業員に報酬を支払い</p>
                      <p className="text-xs text-gray-500">従業員の残高に報酬（{Math.round((1 - feeRate) * 100)}%）を加算します{resolveTarget.order?.is_paid_out ? '（支払い済み）' : ''}</p>
                    </div>
                  </label>

                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${resolveAction === 'none' ? 'border-gray-500 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="action" value="none" checked={resolveAction === 'none'} onChange={() => setResolveAction('none')} className="mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">✋ お金の移動なし</p>
                      <p className="text-xs text-gray-500">ステータスのみ解決済みにします</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">解決メモ（任意）</label>
                <textarea className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm" rows={2} placeholder="解決の経緯など" value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowResolveModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">キャンセル</button>
                <button onClick={executeResolve} disabled={resolveLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                  {resolveLoading ? '処理中...' : '解決する'}
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
