import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, logAdminAction, invokeEdgeFunction } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';
import Pagination from '../../../../components/base/Pagination';

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState<string | null>(null); // 処理中のorder_id
  const [feeRate, setFeeRate] = useState(0.20);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

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

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const result = await invokeEdgeFunction<{ success: boolean; data: any[]; error?: string }>('admin-api', { action: 'list-orders' });
      if (!result.success) { console.error(result.error); setOrders([]); }
      else setOrders(result.data || []);
    } catch (err) { console.error(err); setOrders([]); }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        o.id?.toLowerCase().includes(q) ||
        o.user_id?.toLowerCase().includes(q) ||
        o.employee_id?.toLowerCase().includes(q) ||
        o.game_title?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /** Edge Functionを呼ぶヘルパー（エラー詳細を取得するため直接fetch） */
  async function callEdgeFunction(functionName: string, body: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Edge Function エラー (${res.status})`);
    }
    return data;
  }

  async function sendNotification(userId: string, type: string, title: string, body: string) {
    try {
      await callEdgeFunction('create-notification', { user_id: userId, type, title, body, link_url: '/dashboard/customer' });
    } catch { /* 通知失敗は無視 */ }
  }

  /** 強制キャンセル + Stripe自動返金 */
  async function forceCancel(order: any) {
    const msg = `⚠ 強制キャンセル + 全額返金\n\n注文: ${order.id.slice(0, 8)}...\n金額: ¥${(order.price || order.total_price || 0).toLocaleString()}\n\nStripeで自動返金されます。続行しますか？`;
    if (!window.confirm(msg)) return;

    setProcessing(order.id);

    try {
      const result = await callEdgeFunction('refund-order', { order_id: order.id });
      await logAdminAction({ action: 'order_force_cancelled', targetType: 'order', targetId: order.id, details: `注文を強制キャンセル+返金 ¥${(order.price || order.total_price || 0).toLocaleString()}`, meta: { refund_id: result.refund_id, amount: result.amount } });
      // 依頼者に通知
      if (order.user_id) {
        await sendNotification(order.user_id, 'order_cancelled', '注文がキャンセルされました', `注文が管理者によりキャンセルされました。全額返金されます。`);
      }
      // 従業員に通知
      if (order.employee_id) {
        await sendNotification(order.employee_id, 'order_cancelled', '担当注文がキャンセルされました', `担当していた注文が管理者によりキャンセルされました。`);
      }
      alert(`✅ 返金完了\n\n返金ID: ${result.refund_id || '-'}\n金額: ¥${(result.amount || 0).toLocaleString()}`);
    } catch (err: any) {
      alert(`❌ エラー: ${err.message}\n\nStripeダッシュボード(dashboard.stripe.com)から手動で返金してください。`);
      await invokeEdgeFunction('admin-api', { action: 'change-order-status', order_id: order.id, new_status: 'cancelled' }).catch(() => {});
      await logAdminAction({ action: 'order_force_cancelled_fallback', targetType: 'order', targetId: order.id, details: `返金エラー、ステータスのみキャンセルに変更`, meta: { error: err.message } });
    }

    setProcessing(null);
    loadOrders();
  }

  /** 強制完了 + 残高加算 */
  async function forceComplete(order: any) {
    const totalPrice = order.price || order.total_price || 0;
    const platformFee = order.platform_fee || Math.round(totalPrice * feeRate);
    const payoutAmount = totalPrice - platformFee;
    const feePercent = Math.round(feeRate * 100);
    const payoutPercent = 100 - feePercent;

    const msg = `✅ 強制完了 + 従業員の残高に加算\n\n注文: ${order.id.slice(0, 8)}...\n総額: ¥${totalPrice.toLocaleString()}\n手数料(${feePercent}%): ¥${platformFee.toLocaleString()}\n従業員への支払い(${payoutPercent}%): ¥${payoutAmount.toLocaleString()}\n\n従業員の残高に加算されます。続行しますか？`;
    if (!window.confirm(msg)) return;

    setProcessing(order.id);

    try {
      const result = await callEdgeFunction('payout-employee', { order_id: order.id });
      await invokeEdgeFunction('admin-api', { action: 'change-order-status', order_id: order.id, new_status: 'confirmed' });
      await logAdminAction({ action: 'order_force_completed', targetType: 'order', targetId: order.id, details: `注文を強制完了+従業員支払い ¥${payoutAmount.toLocaleString()}`, meta: { total_price: totalPrice, platform_fee: platformFee, payout_amount: payoutAmount } });
      // 依頼者に通知
      if (order.user_id) {
        await sendNotification(order.user_id, 'order_completed', '注文が完了しました', `注文が管理者により完了処理されました。`);
      }
      // 従業員に通知
      if (order.employee_id) {
        await sendNotification(order.employee_id, 'order_confirmed', '報酬が支払われました', `管理者により注文が完了処理され、報酬 ¥${payoutAmount.toLocaleString()} が残高に反映されました。`);
      }
      alert(`✅ 完了\n\n${result.message}`);
    } catch (err: any) {
      alert(`❌ エラー: ${err.message}`);
      await invokeEdgeFunction('admin-api', { action: 'change-order-status', order_id: order.id, new_status: 'completed' }).catch(() => {});
      await logAdminAction({ action: 'order_force_completed_fallback', targetType: 'order', targetId: order.id, details: `支払いエラー、ステータスのみ完了に変更`, meta: { error: err.message } });
    }

    setProcessing(null);
    loadOrders();
  }

  /** ステータスだけ変更（返金・支払いなし） */
  async function changeStatusOnly(orderId: string, newStatus: string) {
    if (!window.confirm(`ステータスを「${statusLabel(newStatus)}」に変更しますか？\n\n※ お金の移動はありません`)) return;
    try {
      const result = await invokeEdgeFunction<{ success: boolean; error?: string }>('admin-api', { action: 'change-order-status', order_id: orderId, new_status: newStatus });
      if (!result.success) { alert('エラー: ' + result.error); return; }
    } catch (err: any) { alert('エラー: ' + err.message); return; }
    await logAdminAction({ action: 'order_status_changed', targetType: 'order', targetId: orderId, details: `注文ステータスを ${statusLabel(newStatus)} に変更`, meta: { new_status: newStatus } });
    loadOrders();
  }

  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      paid: '支払済', pending: '保留中', assigned: '受注済',
      in_progress: '作業中', completed: '完了', confirmed: '確認済',
      cancelled: 'キャンセル', PAYMENT_PENDING: '決済待ち',
    };
    return map[status] || status;
  }

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      confirmed: 'bg-green-600 text-white',
      cancelled: 'bg-red-100 text-red-800',
      PAYMENT_PENDING: 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[status] || 'bg-gray-100 text-gray-800'}`}>{statusLabel(status)}</span>;
  };

  const statuses = ['all', 'paid', 'assigned', 'in_progress', 'completed', 'confirmed', 'cancelled'];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button onClick={() => navigate('/dashboard/admin')} className="text-purple-600 hover:underline text-sm mb-2 block">← 管理者ダッシュボード</button>
              <h1 className="text-3xl font-bold text-gray-900">📦 注文管理</h1>
            </div>
            <button onClick={loadOrders} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition">🔄 更新</button>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
            <input
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1 min-w-[200px]"
              placeholder="ID・ユーザーIDで検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-sm ${statusFilter === s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {s === 'all' ? 'すべて' : statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">{filtered.length}件の注文</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">該当する注文がありません</div>
              ) : (
                paged.map((o) => {
                  const isProcessing = processing === o.id;
                  const totalPrice = o.price || o.total_price || 0;
                  return (
                    <div key={o.id} className={`bg-white rounded-lg shadow-sm p-5 ${isProcessing ? 'opacity-60' : ''}`}>
                      {/* ヘッダー */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{o.current_rank || '?'} → {o.target_rank || '?'}</p>
                          <p className="text-sm text-gray-500">{o.game_title || 'Brawl Stars'}</p>
                          <p className="text-xs text-gray-400 mt-1 font-mono">ID: {o.id.slice(0, 8)}...</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(o.status)}
                          <p className="font-bold text-green-600 mt-1">¥{totalPrice.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* 情報グリッド */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">依頼者</span>
                          <p className="font-mono text-xs">{(o.user_id || o.customer_id)?.slice(0, 8) || '-'}...</p>
                        </div>
                        <div>
                          <span className="text-gray-500">従業員</span>
                          <p className="font-mono text-xs">{o.employee_id?.slice(0, 8) || '未割当'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">作成日</span>
                          <p>{new Date(o.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">返金/支払い</span>
                          <p className="text-xs">
                            {o.is_refunded && <span className="text-red-600">返金済 </span>}
                            {o.is_paid_out && <span className="text-green-600">支払済 </span>}
                            {!o.is_refunded && !o.is_paid_out && <span className="text-gray-400">なし</span>}
                          </p>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        {/* 強制キャンセル + 返金 */}
                        {!['cancelled'].includes(o.status) && !o.is_refunded && (
                          <button
                            onClick={() => forceCancel(o)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
                          >
                            {isProcessing ? '処理中...' : '❌ キャンセル + 返金'}
                          </button>
                        )}

                        {/* 強制完了 + 従業員支払い */}
                        {['assigned', 'in_progress', 'completed'].includes(o.status) && !o.is_paid_out && o.employee_id && (
                          <button
                            onClick={() => forceComplete(o)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
                          >
                            {isProcessing ? '処理中...' : '✅ 完了 + 残高加算'}
                          </button>
                        )}

                        {/* ステータスのみ変更 */}
                        {o.status === 'paid' && !o.employee_id && (
                          <button onClick={() => changeStatusOnly(o.id, 'pending')} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">保留に戻す</button>
                        )}

                        {/* 返金済みだがステータスがキャンセルでない場合 → ステータスのみキャンセル */}
                        {o.is_refunded && o.status !== 'cancelled' && (
                          <button onClick={() => changeStatusOnly(o.id, 'cancelled')}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                            ステータスをキャンセルに変更
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
