import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, logAdminAction, invokeEdgeFunction } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';
import Pagination from '../../../../components/base/Pagination';

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  type: string;        // 'earning' | 'withdrawal'
  status: string;      // 'pending' | 'completed' | 'rejected'
  description: string | null;
  transfer_id: string | null;
  order_id: string | null;
  created_at: string;
};

type EmployeeProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  balance: number;
  bank_account_info: any | null;
  role: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: '承認待ち', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  completed: { label: '完了',     color: 'bg-green-50 text-green-700 border-green-200' },
  rejected:  { label: '却下',     color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function AdminWithdrawalsPage() {
  const navigate = useNavigate();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [employees, setEmployees] = useState<Record<string, EmployeeProfile>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'withdrawal' | 'earning'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [tab, setTab] = useState<'history' | 'balances'>('history');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // 処理中の承認/却下
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 残高調整モーダル
  const [adjustModal, setAdjustModal] = useState<EmployeeProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      const result = await invokeEdgeFunction<{
        success: boolean;
        data: { withdrawals: Withdrawal[]; employees: EmployeeProfile[] };
        error?: string;
      }>('admin-api', { action: 'list-withdrawals' });

      if (result.success) {
        setWithdrawals(result.data.withdrawals || []);
        const map: Record<string, EmployeeProfile> = {};
        for (const p of result.data.employees || []) map[p.id] = p;
        setEmployees(map);
      }
    } catch (err) {
      console.error('loadData error:', err);
    }

    setLoading(false);
  }

  /* ── フィルタリング ── */
  const filtered = useMemo(() => {
    return withdrawals.filter((w) => {
      const q = search.trim().toLowerCase();
      const emp = employees[w.user_id];
      const name = (emp?.username || emp?.full_name || '').toLowerCase();
      const matchSearch =
        !q ||
        name.includes(q) ||
        w.user_id.toLowerCase().includes(q) ||
        (w.description || '').toLowerCase().includes(q) ||
        (w.transfer_id || '').toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || w.type === typeFilter;
      const matchStatus = statusFilter === 'all' || w.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [withdrawals, search, typeFilter, statusFilter, employees]);

  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── 統計 ── */
  const stats = useMemo(() => {
    const pending = withdrawals.filter((w) => w.type === 'withdrawal' && w.status === 'pending');
    const pendingTotal = pending.reduce((s, w) => s + w.amount, 0);
    const completedTotal = withdrawals
      .filter((w) => w.type === 'withdrawal' && w.status === 'completed')
      .reduce((s, w) => s + w.amount, 0);
    const totalBalance = Object.values(employees).reduce((s, e) => s + (e.balance || 0), 0);
    return { pendingCount: pending.length, pendingTotal, completedTotal, totalBalance };
  }, [withdrawals, employees]);

  /* ── 承認 ── */
  async function handleApprove(w: Withdrawal) {
    if (!confirm(`¥${w.amount.toLocaleString()} の出金を承認して振込完了として処理しますか？`)) return;
    setProcessingId(w.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-withdrawal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ withdrawal_id: w.id, action: 'approve' }),
        }
      );
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      await logAdminAction({
        action: 'WITHDRAWAL_APPROVED',
        targetType: 'withdrawal',
        targetId: w.id,
        details: `出金承認: ¥${w.amount.toLocaleString()} (${employees[w.user_id]?.username || w.user_id})`,
        meta: { amount: w.amount, transfer_id: result.transfer_id },
      });

      await loadData();
    } catch (err: any) {
      alert(`承認に失敗しました: ${err.message}`);
    }
    setProcessingId(null);
  }

  /* ── 却下 ── */
  async function handleReject(w: Withdrawal) {
    if (!confirm(`¥${w.amount.toLocaleString()} の出金申請を却下しますか？残高は返還されます。`)) return;
    setProcessingId(w.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-withdrawal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ withdrawal_id: w.id, action: 'reject' }),
        }
      );
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      await logAdminAction({
        action: 'WITHDRAWAL_REJECTED',
        targetType: 'withdrawal',
        targetId: w.id,
        details: `出金却下: ¥${w.amount.toLocaleString()} (${employees[w.user_id]?.username || w.user_id})`,
        meta: { amount: w.amount },
      });

      await loadData();
    } catch (err: any) {
      alert(`却下に失敗しました: ${err.message}`);
    }
    setProcessingId(null);
  }

  /* ── 残高調整 ── */
  async function handleAdjustBalance() {
    if (!adjustModal) return;
    const delta = parseInt(adjustAmount, 10);
    if (isNaN(delta) || delta === 0) return;
    if (!adjustReason.trim()) { alert('理由を入力してください'); return; }

    setAdjustSaving(true);
    const newBalance = (adjustModal.balance || 0) + delta;
    if (newBalance < 0) { alert('残高がマイナスになります'); setAdjustSaving(false); return; }

    try {
      const result = await invokeEdgeFunction<{ success: boolean; error?: string }>('admin-api', {
        action: 'adjust-balance',
        user_id: adjustModal.id,
        new_balance: newBalance,
        description: `管理者調整 ${delta > 0 ? '+' : ''}¥${delta.toLocaleString()}: ${adjustReason}`,
        amount: Math.abs(delta),
        type: delta > 0 ? 'earning' : 'withdrawal',
      });

      if (!result.success) {
        alert(`更新に失敗しました: ${result.error}`);
        setAdjustSaving(false);
        return;
      }
    } catch (err: any) {
      alert(`更新に失敗しました: ${err.message}`);
      setAdjustSaving(false);
      return;
    }

    await logAdminAction({
      action: 'BALANCE_ADJUSTED',
      targetType: 'profile',
      targetId: adjustModal.id,
      details: `残高調整 ${delta > 0 ? '+' : ''}¥${delta.toLocaleString()} → ¥${newBalance.toLocaleString()} (${adjustReason})`,
      meta: { old_balance: adjustModal.balance, new_balance: newBalance, delta, reason: adjustReason },
    });

    setAdjustModal(null);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustSaving(false);
    await loadData();
  }

  const employeeList = useMemo(() => {
    return Object.values(employees)
      .filter((e) => e.role !== 'admin')
      .sort((a, b) => (b.balance || 0) - (a.balance || 0));
  }, [employees]);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 pt-28 pb-8">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => navigate('/dashboard/admin')}
                className="text-purple-600 hover:underline text-sm mb-2 block"
              >
                ← 管理者ダッシュボード
              </button>
              <h1 className="text-3xl font-bold text-gray-900">💰 出金管理</h1>
              <p className="text-sm text-gray-500 mt-1">
                出金申請の承認・却下、従業員の残高管理ができます。
              </p>
            </div>
            <button
              onClick={loadData}
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              🔄 更新
            </button>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
              <p className="text-xs text-gray-500">承認待ち</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">¥{stats.pendingTotal.toLocaleString()}</p>
              <p className="text-xs text-gray-500">承認待ち合計</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-green-600">¥{stats.completedTotal.toLocaleString()}</p>
              <p className="text-xs text-gray-500">出金済み合計</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">¥{stats.totalBalance.toLocaleString()}</p>
              <p className="text-xs text-gray-500">従業員残高合計</p>
            </div>
          </div>

          {/* タブ */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              出金履歴
            </button>
            <button
              onClick={() => setTab('balances')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === 'balances' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              従業員残高
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
            </div>
          ) : tab === 'history' ? (
            <>
              {/* フィルター */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
                <input
                  className="border border-gray-300 rounded-lg px-4 py-2 flex-1 min-w-[200px]"
                  placeholder="ユーザー名・ID・説明で検索"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-500">種類:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="withdrawal">出金</option>
                    <option value="earning">報酬</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-500">状態:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">すべて</option>
                    <option value="pending">承認待ち</option>
                    <option value="completed">完了</option>
                    <option value="rejected">却下</option>
                  </select>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">{filtered.length}件</p>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                  該当する履歴がありません。
                </div>
              ) : (
                <div className="space-y-3">
                  {paged.map((w) => {
                    const emp = employees[w.user_id];
                    const displayName = emp?.username || emp?.full_name || w.user_id.slice(0, 8) + '...';
                    const st = STATUS_LABELS[w.status] || { label: w.status, color: 'bg-gray-50 text-gray-600' };
                    const isWithdrawal = w.type === 'withdrawal';

                    return (
                      <div
                        key={w.id}
                        className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                          w.status === 'pending' ? 'border-yellow-400' :
                          w.status === 'rejected' ? 'border-red-300' :
                          'border-gray-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-lg">{isWithdrawal ? '📤' : '📥'}</span>
                              <span className="font-bold text-gray-900">
                                {isWithdrawal ? '' : '+'}¥{w.amount.toLocaleString()}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded border ${st.color} font-medium`}>
                                {st.label}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                                {isWithdrawal ? '出金' : '報酬'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                              <span>従業員: {displayName}</span>
                              {w.description && (
                                <span className="truncate max-w-xs">{w.description}</span>
                              )}
                              {w.transfer_id && (
                                <span className="font-mono">Transfer: {w.transfer_id.slice(0, 16)}...</span>
                              )}
                              {w.order_id && (
                                <span className="font-mono">注文: {w.order_id.slice(0, 8)}...</span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <span className="text-sm text-gray-400">
                              {new Date(w.created_at).toLocaleString('ja-JP')}
                            </span>
                            {w.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(w)}
                                  disabled={processingId === w.id}
                                  className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-md hover:bg-green-100 transition font-medium disabled:opacity-50"
                                >
                                  {processingId === w.id ? '処理中...' : '✓ 承認'}
                                </button>
                                <button
                                  onClick={() => handleReject(w)}
                                  disabled={processingId === w.id}
                                  className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-100 transition font-medium disabled:opacity-50"
                                >
                                  ✕ 却下
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          ) : (
            /* ── 従業員残高タブ ── */
            <>
              {employeeList.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                  従業員がいません。
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left">
                        <th className="px-4 py-3 font-medium text-gray-600">従業員</th>
                        <th className="px-4 py-3 font-medium text-gray-600 text-right">残高</th>
                        <th className="px-4 py-3 font-medium text-gray-600 text-center">口座</th>
                        <th className="px-4 py-3 font-medium text-gray-600 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeList.map((emp) => (
                        <tr key={emp.id} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">
                              {emp.username || emp.full_name || '名前未設定'}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">{emp.id.slice(0, 12)}...</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${emp.balance > 0 ? 'text-purple-700' : 'text-gray-400'}`}>
                              ¥{(emp.balance || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {emp.bank_account_info ? (
                              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">登録済</span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">未登録</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => { setAdjustModal(emp); setAdjustAmount(''); setAdjustReason(''); }}
                              className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-md hover:bg-purple-100 transition font-medium"
                            >
                              残高調整
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 残高調整モーダル ── */}
        {adjustModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">残高調整</h2>
              <p className="text-sm text-gray-500 mb-4">
                {adjustModal.username || adjustModal.full_name || adjustModal.id.slice(0, 12)}
                （現在: ¥{(adjustModal.balance || 0).toLocaleString()}）
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    調整額（+で加算、-で減算）
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="例: 500 または -300"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                  {adjustAmount && !isNaN(parseInt(adjustAmount, 10)) && (
                    <p className="text-xs text-gray-400 mt-1">
                      調整後: ¥{((adjustModal.balance || 0) + parseInt(adjustAmount, 10)).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    理由 <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="例: 報酬の修正、ボーナス支給"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setAdjustModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAdjustBalance}
                  disabled={adjustSaving || !adjustAmount || !adjustReason.trim()}
                  className="px-6 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
                >
                  {adjustSaving ? '保存中...' : '調整を実行'}
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
