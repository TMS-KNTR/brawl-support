import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

/** 注文の関連情報（Supabase の select で取得する形） */
type OrderRelation = {
  current_rank?: string;
  target_rank?: string;
  game_title?: string;
  status?: string;
  id?: string;
};

/** チャットスレッド（orders は 1件 or 配列で返ることがある） */
type ChatThreadRow = {
  id: string;
  order_id?: string;
  created_at: string;
  orders?: OrderRelation | OrderRelation[] | null;
};

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    paid: '支払済',
    pending: '保留中',
    assigned: '受注済',
    in_progress: '作業中',
    completed: '完了',
    confirmed: '確認済',
    cancelled: 'キャンセル',
    PAYMENT_PENDING: '決済待ち',
  };
  return map[status] || status;
}

function getStatusBadge(status: string) {
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
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export default function AdminChatsPage() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadThreads();
  }, []);

  async function loadThreads() {
    setLoading(true);
    const { data } = await supabase
      .from('chat_threads')
      .select('id, order_id, created_at, orders(id, current_rank, target_rank, game_title, status)')
      .order('created_at', { ascending: false });
    setThreads((data as ChatThreadRow[]) || []);
    setLoading(false);
  }

  /** スレッドから注文情報を1件取り出す */
  function getOrder(t: ChatThreadRow): OrderRelation | null {
    const raw = t.orders;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] ?? null : raw;
  }

  const filtered = useMemo(() => {
    return threads.filter((t) => {
      const order = getOrder(t);
      const status = order?.status ?? '';
      const gameTitle = (order?.game_title ?? '').toLowerCase();
      const threadId = (t.id ?? '').toLowerCase();
      const orderId = (t.order_id ?? '').toLowerCase();
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        threadId.includes(q) ||
        orderId.includes(q) ||
        gameTitle.includes(q) ||
        (order?.current_rank ?? '').toLowerCase().includes(q) ||
        (order?.target_rank ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [threads, search, statusFilter]);

  const statuses = [
    'all',
    'paid',
    'assigned',
    'in_progress',
    'completed',
    'confirmed',
    'cancelled',
    'pending',
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => navigate('/dashboard/admin')}
                className="text-purple-600 hover:underline text-sm mb-2 block"
              >
                ← 管理者ダッシュボード
              </button>
              <h1 className="text-3xl font-bold text-gray-900">💬 チャット管理</h1>
              <p className="text-sm text-gray-500 mt-1">チャットの監視・閲覧。スレッドをクリックして内容を確認できます。</p>
            </div>
            <button
              onClick={loadThreads}
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              🔄 更新
            </button>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
            <input
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1 min-w-[200px]"
              placeholder="スレッドID・注文ID・ゲーム名・ランクで検索"
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

          <p className="text-sm text-gray-500 mb-4">{filtered.length}件のスレッド</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
              該当するチャットスレッドがありません
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => {
                const order = getOrder(t);
                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-lg shadow-sm p-5 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {order?.current_rank ?? '?'} → {order?.target_rank ?? '?'}
                        </span>
                        <span className="text-sm text-gray-500">{order?.game_title ?? 'ゲーム'}</span>
                        {order?.status != null && getStatusBadge(order.status)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 font-mono">
                        <span>スレッド: {t.id.slice(0, 8)}...</span>
                        {t.order_id && <span>注文: {t.order_id.slice(0, 8)}...</span>}
                        <span>{new Date(t.created_at).toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {order?.id && (
                        <button
                          onClick={() => navigate('/dashboard/admin/orders')}
                          className="text-gray-600 hover:text-purple-600 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 hover:border-purple-300 transition"
                        >
                          注文管理で確認
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/chat/${t.id}`)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                      >
                        💬 チャット閲覧
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
