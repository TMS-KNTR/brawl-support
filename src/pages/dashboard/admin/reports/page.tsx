import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { invokeEdgeFunction } from '../../../../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Order {
  id: string;
  status: string;
  price: number;
  platform_fee: number | null;
  is_refunded: boolean;
  is_paid_out: boolean;
  created_at: string;
  game_title: string | null;
  user_id: string | null;
  employee_id: string | null;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  description: string | null;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
}

interface StripeFees {
  total_fees: number;
  total_gross: number;
  total_net: number;
  transaction_count: number;
  monthly: Record<string, { fees: number; gross: number; net: number; count: number }>;
}

interface MonthlySummary {
  month: string;
  label: string;
  grossSales: number;
  platformFee: number;
  refunds: number;
  employeePayouts: number;
  netRevenue: number;
  orderCount: number;
  completedCount: number;
  cancelledCount: number;
}

const EXPENSE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'stripe_fee', label: 'Stripe決済手数料' },
  { value: 'server', label: 'サーバー・インフラ費' },
  { value: 'domain', label: 'ドメイン費' },
  { value: 'advertising', label: '広告宣伝費' },
  { value: 'tools', label: 'ツール・サービス費' },
  { value: 'outsourcing', label: '外注費' },
  { value: 'other', label: 'その他' },
];

function categoryLabel(cat: string) {
  return EXPENSE_CATEGORIES.find(c => c.value === cat)?.label ?? cat;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toYYYYMM(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function toJPLabel(yyyymm: string) {
  const [y, m] = yyyymm.split('-');
  return `${y}年${Number(m)}月`;
}

function getFiscalYearRange(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

function formatCurrency(n: number) {
  return `¥${n.toLocaleString()}`;
}

function downloadCSV(filename: string, csvContent: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminReportsPage() {
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [feeRate, setFeeRate] = useState(0.2);
  const [loading, setLoading] = useState(true);

  // Stripe fees
  const [stripeFees, setStripeFees] = useState<StripeFees | null>(null);
  const [stripeFeesLoading, setStripeFeesLoading] = useState(false);

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    category: 'server',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    receipt_url: '',
  });

  const getRange = useCallback(() => {
    return useCustomRange && customFrom && customTo
      ? { from: customFrom, to: customTo }
      : getFiscalYearRange(selectedYear);
  }, [useCustomRange, customFrom, customTo, selectedYear]);

  // --- Data fetch ---
  useEffect(() => { loadData(); }, [selectedYear, useCustomRange, customFrom, customTo]);

  async function loadData() {
    setLoading(true);
    const range = getRange();

    try {
      const [reportResult, expensesResult] = await Promise.all([
        invokeEdgeFunction<{ success: boolean; data?: { orders: Order[]; withdrawals: Withdrawal[]; platform_fee_rate: number }; error?: string }>('admin-api', {
          action: 'get-reports',
          from_date: range.from,
          to_date: range.to,
        }),
        invokeEdgeFunction<{ success: boolean; data?: Expense[]; error?: string }>('admin-api', {
          action: 'list-expenses',
          from_date: range.from,
          to_date: range.to,
        }),
      ]);

      if (reportResult.success && reportResult.data) {
        setOrders(reportResult.data.orders ?? []);
        setWithdrawals(reportResult.data.withdrawals ?? []);
        if (reportResult.data.platform_fee_rate != null) {
          setFeeRate(Number(reportResult.data.platform_fee_rate));
        }
      }
      setExpenses(expensesResult.data ?? []);
    } catch (e: any) {
      console.error('レポート取得エラー:', e);
    }
    setLoading(false);
  }

  // --- Stripe fees fetch ---
  async function loadStripeFees() {
    setStripeFeesLoading(true);
    const range = getRange();
    try {
      const result = await invokeEdgeFunction<{ success: boolean; data?: StripeFees; error?: string }>('admin-api', {
        action: 'get-stripe-fees',
        from_date: range.from,
        to_date: range.to,
      });
      if (result.success && result.data) {
        setStripeFees(result.data);
      } else {
        alert(result.error || 'Stripe手数料の取得に失敗しました');
      }
    } catch (e: any) {
      console.error('Stripe手数料取得エラー:', e);
      alert('Stripe手数料の取得に失敗しました');
    }
    setStripeFeesLoading(false);
  }

  // --- Expense CRUD ---
  async function saveExpense() {
    const amount = parseInt(expenseForm.amount, 10);
    if (!expenseForm.description || !amount || !expenseForm.expense_date) {
      alert('説明、金額、日付は必須です');
      return;
    }

    try {
      if (editingExpense) {
        await invokeEdgeFunction('admin-api', {
          action: 'update-expense',
          id: editingExpense.id,
          category: expenseForm.category,
          description: expenseForm.description,
          amount,
          expense_date: expenseForm.expense_date,
          receipt_url: expenseForm.receipt_url || null,
        });
      } else {
        await invokeEdgeFunction('admin-api', {
          action: 'create-expense',
          category: expenseForm.category,
          description: expenseForm.description,
          amount,
          expense_date: expenseForm.expense_date,
          receipt_url: expenseForm.receipt_url || null,
        });
      }
      resetExpenseForm();
      loadData();
    } catch (e: any) {
      alert('経費の保存に失敗しました: ' + e.message);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm('この経費を削除しますか？')) return;
    try {
      await invokeEdgeFunction('admin-api', { action: 'delete-expense', id });
      loadData();
    } catch (e: any) {
      alert('削除に失敗しました');
    }
  }

  function startEditExpense(exp: Expense) {
    setEditingExpense(exp);
    setExpenseForm({
      category: exp.category,
      description: exp.description,
      amount: String(exp.amount),
      expense_date: exp.expense_date,
      receipt_url: exp.receipt_url || '',
    });
    setShowExpenseForm(true);
  }

  function resetExpenseForm() {
    setShowExpenseForm(false);
    setEditingExpense(null);
    setExpenseForm({
      category: 'server',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().slice(0, 10),
      receipt_url: '',
    });
  }

  // --- Monthly aggregation ---
  const monthlySummaries: MonthlySummary[] = useMemo(() => {
    const map = new Map<string, MonthlySummary>();

    for (const o of orders) {
      const key = toYYYYMM(o.created_at);
      if (!map.has(key)) {
        map.set(key, {
          month: key, label: toJPLabel(key),
          grossSales: 0, platformFee: 0, refunds: 0, employeePayouts: 0, netRevenue: 0,
          orderCount: 0, completedCount: 0, cancelledCount: 0,
        });
      }
      const s = map.get(key)!;
      s.orderCount++;

      if (o.status === 'cancelled') {
        s.cancelledCount++;
        if (o.is_refunded) s.refunds += o.price || 0;
      } else {
        s.grossSales += o.price || 0;
        const fee = o.platform_fee ?? Math.round((o.price || 0) * feeRate);
        s.platformFee += fee;
        if (['completed', 'confirmed'].includes(o.status)) {
          s.completedCount++;
          if (o.is_paid_out) {
            s.employeePayouts += (o.price || 0) - fee;
          }
        }
      }
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    sorted.forEach(s => { s.netRevenue = s.platformFee; });
    return sorted;
  }, [orders, feeRate]);

  // --- Totals ---
  const totals = useMemo(() => {
    const t = {
      grossSales: 0, platformFee: 0, refunds: 0, employeePayouts: 0, netRevenue: 0,
      orderCount: 0, completedCount: 0, cancelledCount: 0,
      withdrawalTotal: 0, withdrawalPending: 0,
    };
    for (const s of monthlySummaries) {
      t.grossSales += s.grossSales;
      t.platformFee += s.platformFee;
      t.refunds += s.refunds;
      t.employeePayouts += s.employeePayouts;
      t.netRevenue += s.netRevenue;
      t.orderCount += s.orderCount;
      t.completedCount += s.completedCount;
      t.cancelledCount += s.cancelledCount;
    }
    for (const w of withdrawals) {
      if (w.type === 'withdrawal' && w.status === 'completed') t.withdrawalTotal += w.amount;
      if (w.type === 'withdrawal' && w.status === 'pending') t.withdrawalPending += w.amount;
    }
    return t;
  }, [monthlySummaries, withdrawals]);

  // --- Expense totals ---
  const expenseTotals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let total = 0;
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      total += e.amount;
    }
    return { byCategory, total };
  }, [expenses]);

  // --- CSV Exports ---
  function exportMonthlySummaryCSV() {
    const header = '年月,総売上(税込),プラットフォーム手数料,返金額,従業員支払額,純収益(手数料収入),注文数,完了数,キャンセル数';
    const rows = monthlySummaries.map(s =>
      `${s.label},${s.grossSales},${s.platformFee},${s.refunds},${s.employeePayouts},${s.netRevenue},${s.orderCount},${s.completedCount},${s.cancelledCount}`
    );
    rows.push(`合計,${totals.grossSales},${totals.platformFee},${totals.refunds},${totals.employeePayouts},${totals.netRevenue},${totals.orderCount},${totals.completedCount},${totals.cancelledCount}`);
    const csv = [header, ...rows].join('\n');
    const label = useCustomRange ? `${customFrom}_${customTo}` : `${selectedYear}`;
    downloadCSV(`売上レポート_月別_${label}.csv`, csv);
  }

  function csvEscape(value: string) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  function exportOrderDetailCSV() {
    const header = '注文ID,ステータス,金額,プラットフォーム手数料,返金済,支払済,ゲーム,注文日時';
    const rows = orders.map(o => {
      const fee = o.platform_fee ?? Math.round((o.price || 0) * feeRate);
      return `${o.id},${o.status},${o.price || 0},${fee},${o.is_refunded ? 'はい' : 'いいえ'},${o.is_paid_out ? 'はい' : 'いいえ'},${csvEscape(o.game_title || '')},${o.created_at}`;
    });
    const csv = [header, ...rows].join('\n');
    const label = useCustomRange ? `${customFrom}_${customTo}` : `${selectedYear}`;
    downloadCSV(`注文明細_${label}.csv`, csv);
  }

  function exportWithdrawalCSV() {
    const header = '出金ID,ユーザーID,金額,種別,ステータス,説明,日時';
    const rows = withdrawals.map(w =>
      `${w.id},${w.user_id},${w.amount},${w.type},${w.status},${csvEscape(w.description || '')},${w.created_at}`
    );
    const csv = [header, ...rows].join('\n');
    const label = useCustomRange ? `${customFrom}_${customTo}` : `${selectedYear}`;
    downloadCSV(`出金明細_${label}.csv`, csv);
  }

  function exportExpenseCSV() {
    const header = '日付,カテゴリ,説明,金額';
    const rows = expenses.map(e =>
      `${e.expense_date},${categoryLabel(e.category)},${csvEscape(e.description)},${e.amount}`
    );
    rows.push(`合計,,,${expenseTotals.total}`);
    const csv = [header, ...rows].join('\n');
    const label = useCustomRange ? `${customFrom}_${customTo}` : `${selectedYear}`;
    downloadCSV(`経費明細_${label}.csv`, csv);
  }

  function exportTaxSummaryCSV() {
    const stripeFeeTotal = stripeFees?.total_fees ?? 0;
    const header = '項目,金額';
    const rows = [
      `売上高（総取引額）,${totals.grossSales}`,
      `プラットフォーム手数料収入,${totals.platformFee}`,
      `返金・キャンセル額,-${totals.refunds}`,
      `従業員への支払額（外注費）,-${totals.employeePayouts}`,
      `Stripe決済手数料,-${stripeFeeTotal}`,
      `その他経費,-${expenseTotals.total}`,
      ``,
      `【経費内訳】,`,
      ...Object.entries(expenseTotals.byCategory).map(([cat, amt]) => `  ${categoryLabel(cat)},${amt}`),
      ...(stripeFeeTotal > 0 ? [`  Stripe決済手数料（API取得）,${stripeFeeTotal}`] : []),
      ``,
      `差引利益（課税所得）,${totals.platformFee - totals.refunds - totals.employeePayouts - stripeFeeTotal - expenseTotals.total}`,
    ];
    const csv = [header, ...rows].join('\n');
    const label = useCustomRange ? `${customFrom}_${customTo}` : `${selectedYear}`;
    downloadCSV(`確定申告用サマリー_${label}.csv`, csv);
  }

  // --- Chart data ---
  const chartData = useMemo(() =>
    monthlySummaries.map(s => ({
      name: s.label.replace(/^\d{4}年/, ''),
      総売上: s.grossSales,
      手数料収入: s.platformFee,
      返金: s.refunds,
    }))
  , [monthlySummaries]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const StatCard = ({ label, value, color = 'text-gray-900', sub = '' }: { label: string; value: string; color?: string; sub?: string }) => (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  const stripeFeeTotal = stripeFees?.total_fees ?? 0;
  const totalExpensesWithStripe = expenseTotals.total + stripeFeeTotal;
  const taxableIncome = totals.platformFee - totals.refunds - totals.employeePayouts - totalExpensesWithStripe;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <button onClick={() => navigate('/dashboard/admin')} className="text-purple-600 hover:underline text-sm mb-2 block">
            &larr; 管理者ダッシュボード
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">売上レポート</h1>

          {/* ---- 期間選択 ---- */}
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期間タイプ</label>
                <select
                  value={useCustomRange ? 'custom' : 'year'}
                  onChange={e => setUseCustomRange(e.target.value === 'custom')}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="year">年度</option>
                  <option value="custom">カスタム期間</option>
                </select>
              </div>

              {!useCustomRange ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年度 (1月〜12月)</label>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                    <input
                      type="date" value={customFrom}
                      onChange={e => setCustomFrom(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                    <input
                      type="date" value={customTo}
                      onChange={e => setCustomTo(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
            </div>
          ) : (
            <>
              {/* ---- サマリーカード ---- */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="総売上" value={formatCurrency(totals.grossSales)} color="text-blue-600" sub="キャンセル除く" />
                <StatCard label="手数料収入" value={formatCurrency(totals.platformFee)} color="text-green-600" sub={`手数料率 ${(feeRate * 100).toFixed(0)}%`} />
                <StatCard label="返金額" value={formatCurrency(totals.refunds)} color="text-red-600" />
                <StatCard label="従業員支払" value={formatCurrency(totals.employeePayouts)} color="text-orange-600" sub={`出金済 ${formatCurrency(totals.withdrawalTotal)}`} />
                <StatCard label="経費合計" value={formatCurrency(totalExpensesWithStripe)} color="text-purple-600" sub={stripeFeeTotal > 0 ? `うちStripe ${formatCurrency(stripeFeeTotal)}` : '経費を登録してください'} />
                <StatCard label="注文数" value={`${totals.completedCount} / ${totals.orderCount}`} sub={`完了 / 全体 (取消 ${totals.cancelledCount})`} />
              </div>

              {/* ---- Stripe決済手数料 ---- */}
              <div className="bg-white rounded-lg shadow-sm p-5 mb-8 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">Stripe 決済手数料</h2>
                  <button
                    onClick={loadStripeFees}
                    disabled={stripeFeesLoading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {stripeFeesLoading ? '取得中...' : stripeFees ? '再取得' : 'Stripeから取得'}
                  </button>
                </div>
                {stripeFees ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">決済手数料合計</p>
                        <p className="text-xl font-bold text-indigo-600 font-mono">{formatCurrency(stripeFees.total_fees)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">総決済額</p>
                        <p className="text-lg font-semibold font-mono">{formatCurrency(stripeFees.total_gross)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stripe入金額</p>
                        <p className="text-lg font-semibold font-mono">{formatCurrency(stripeFees.total_net)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">取引件数</p>
                        <p className="text-lg font-semibold">{stripeFees.transaction_count}件</p>
                      </div>
                    </div>
                    {Object.keys(stripeFees.monthly).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">月別Stripe手数料を表示</summary>
                        <table className="w-full text-sm mt-2">
                          <thead>
                            <tr className="border-b text-left text-gray-500">
                              <th className="py-1">年月</th>
                              <th className="py-1 text-right">決済額</th>
                              <th className="py-1 text-right">手数料</th>
                              <th className="py-1 text-right">入金額</th>
                              <th className="py-1 text-right">件数</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stripeFees.monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => (
                              <tr key={month} className="border-b">
                                <td className="py-1">{toJPLabel(month)}</td>
                                <td className="py-1 text-right font-mono">{formatCurrency(data.gross)}</td>
                                <td className="py-1 text-right font-mono text-indigo-600">{formatCurrency(data.fees)}</td>
                                <td className="py-1 text-right font-mono">{formatCurrency(data.net)}</td>
                                <td className="py-1 text-right">{data.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    「Stripeから取得」ボタンを押すと、Stripe APIから決済手数料を自動取得します。確定申告の経費として計上できます。
                  </p>
                )}
              </div>

              {/* ---- 確定申告用サマリー ---- */}
              <div className="bg-white rounded-lg shadow-sm p-5 mb-8 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">確定申告用サマリー</h2>
                  <button onClick={exportTaxSummaryCSV} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 transition">
                    確定申告用CSV
                  </button>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">売上高 (総取引額)</td>
                      <td className="py-2 text-right font-mono font-semibold">{formatCurrency(totals.grossSales)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">うちプラットフォーム手数料収入</td>
                      <td className="py-2 text-right font-mono font-semibold text-green-600">{formatCurrency(totals.platformFee)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">返金・キャンセル額</td>
                      <td className="py-2 text-right font-mono font-semibold text-red-600">-{formatCurrency(totals.refunds)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600">従業員への支払額 (外注費)</td>
                      <td className="py-2 text-right font-mono font-semibold text-orange-600">-{formatCurrency(totals.employeePayouts)}</td>
                    </tr>
                    {stripeFeeTotal > 0 && (
                      <tr className="border-b">
                        <td className="py-2 text-gray-600">Stripe決済手数料</td>
                        <td className="py-2 text-right font-mono font-semibold text-indigo-600">-{formatCurrency(stripeFeeTotal)}</td>
                      </tr>
                    )}
                    {expenseTotals.total > 0 && (
                      <>
                        <tr className="border-b bg-gray-50">
                          <td className="py-2 text-gray-600 font-medium" colSpan={2}>経費内訳</td>
                        </tr>
                        {Object.entries(expenseTotals.byCategory).map(([cat, amt]) => (
                          <tr key={cat} className="border-b">
                            <td className="py-1.5 text-gray-500 pl-4">{categoryLabel(cat)}</td>
                            <td className="py-1.5 text-right font-mono text-purple-600">-{formatCurrency(amt)}</td>
                          </tr>
                        ))}
                      </>
                    )}
                    <tr className="border-t-2">
                      <td className="py-3 text-gray-900 font-semibold">差引利益 (課税所得)</td>
                      <td className={`py-3 text-right font-mono font-bold text-lg ${taxableIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(taxableIncome)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {!stripeFees && (
                  <p className="text-xs text-amber-600 mt-3">Stripe決済手数料が未取得です。上の「Stripeから取得」ボタンで取得すると、より正確な課税所得が計算されます。</p>
                )}
              </div>

              {/* ---- 経費管理 ---- */}
              <div className="bg-white rounded-lg shadow-sm p-5 mb-8 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">経費管理</h2>
                  <div className="flex gap-2">
                    <button onClick={exportExpenseCSV} disabled={expenses.length === 0} className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded text-xs hover:bg-purple-200 transition disabled:opacity-50">
                      経費CSV
                    </button>
                    <button
                      onClick={() => { resetExpenseForm(); setShowExpenseForm(true); }}
                      className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition"
                    >
                      + 経費を追加
                    </button>
                  </div>
                </div>

                {/* 経費フォーム */}
                {showExpenseForm && (
                  <div className="bg-purple-50 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{editingExpense ? '経費を編集' : '新しい経費を追加'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">カテゴリ</label>
                        <select
                          value={expenseForm.category}
                          onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          {EXPENSE_CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">説明</label>
                        <input
                          type="text"
                          value={expenseForm.description}
                          onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="例: Vercel Pro プラン"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">金額 (円)</label>
                        <input
                          type="number"
                          value={expenseForm.amount}
                          onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                          placeholder="2000"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">日付</label>
                        <input
                          type="date"
                          value={expenseForm.expense_date}
                          onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">領収書URL (任意)</label>
                        <input
                          type="url"
                          value={expenseForm.receipt_url}
                          onChange={e => setExpenseForm(f => ({ ...f, receipt_url: e.target.value }))}
                          placeholder="https://..."
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={saveExpense} className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition">
                        {editingExpense ? '更新' : '追加'}
                      </button>
                      <button onClick={resetExpenseForm} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 transition">
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}

                {/* 経費一覧 */}
                {expenses.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2 pr-3">日付</th>
                        <th className="py-2 pr-3">カテゴリ</th>
                        <th className="py-2 pr-3">説明</th>
                        <th className="py-2 pr-3 text-right">金額</th>
                        <th className="py-2 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr key={e.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 pr-3">{e.expense_date}</td>
                          <td className="py-2 pr-3">
                            <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">
                              {categoryLabel(e.category)}
                            </span>
                          </td>
                          <td className="py-2 pr-3">{e.description}</td>
                          <td className="py-2 pr-3 text-right font-mono">{formatCurrency(e.amount)}</td>
                          <td className="py-2 text-right">
                            <button onClick={() => startEditExpense(e)} className="text-blue-600 hover:underline text-xs mr-2">編集</button>
                            <button onClick={() => deleteExpense(e.id)} className="text-red-600 hover:underline text-xs">削除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold border-t-2">
                        <td className="py-2" colSpan={3}>合計</td>
                        <td className="py-2 text-right font-mono text-purple-600">{formatCurrency(expenseTotals.total)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">経費が登録されていません。「+ 経費を追加」から登録してください。</p>
                )}
              </div>

              {/* ---- 月別グラフ ---- */}
              {chartData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-5 mb-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">月別推移</h2>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="総売上" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="手数料収入" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="返金" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ---- 月別テーブル ---- */}
              <div className="bg-white rounded-lg shadow-sm p-5 mb-8 overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">月別明細</h2>
                  <button onClick={exportMonthlySummaryCSV} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition">
                    CSV エクスポート (月別)
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-3">年月</th>
                      <th className="py-2 pr-3 text-right">総売上</th>
                      <th className="py-2 pr-3 text-right">手数料収入</th>
                      <th className="py-2 pr-3 text-right">返金額</th>
                      <th className="py-2 pr-3 text-right">従業員支払</th>
                      <th className="py-2 pr-3 text-right">注文数</th>
                      <th className="py-2 text-right">完了</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummaries.map(s => (
                      <tr key={s.month} className="border-b hover:bg-gray-50">
                        <td className="py-2 pr-3 font-medium">{s.label}</td>
                        <td className="py-2 pr-3 text-right font-mono">{formatCurrency(s.grossSales)}</td>
                        <td className="py-2 pr-3 text-right font-mono text-green-600">{formatCurrency(s.platformFee)}</td>
                        <td className="py-2 pr-3 text-right font-mono text-red-600">{s.refunds > 0 ? `-${formatCurrency(s.refunds)}` : '¥0'}</td>
                        <td className="py-2 pr-3 text-right font-mono text-orange-600">{formatCurrency(s.employeePayouts)}</td>
                        <td className="py-2 pr-3 text-right">{s.orderCount}</td>
                        <td className="py-2 text-right">{s.completedCount}</td>
                      </tr>
                    ))}
                    {monthlySummaries.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400">データがありません</td></tr>
                    )}
                  </tbody>
                  {monthlySummaries.length > 0 && (
                    <tfoot>
                      <tr className="font-bold border-t-2">
                        <td className="py-2 pr-3">合計</td>
                        <td className="py-2 pr-3 text-right font-mono">{formatCurrency(totals.grossSales)}</td>
                        <td className="py-2 pr-3 text-right font-mono text-green-600">{formatCurrency(totals.platformFee)}</td>
                        <td className="py-2 pr-3 text-right font-mono text-red-600">{totals.refunds > 0 ? `-${formatCurrency(totals.refunds)}` : '¥0'}</td>
                        <td className="py-2 pr-3 text-right font-mono text-orange-600">{formatCurrency(totals.employeePayouts)}</td>
                        <td className="py-2 pr-3 text-right">{totals.orderCount}</td>
                        <td className="py-2 text-right">{totals.completedCount}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* ---- エクスポートボタン群 ---- */}
              <div className="bg-white rounded-lg shadow-sm p-5 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">CSVエクスポート</h2>
                <p className="text-sm text-gray-500 mb-4">確定申告や会計ソフトへの取り込み用にCSVファイルをダウンロードできます。</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={exportTaxSummaryCSV} className="bg-green-700 text-white px-4 py-2 rounded text-sm hover:bg-green-800 transition">
                    確定申告用サマリー CSV
                  </button>
                  <button onClick={exportMonthlySummaryCSV} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition">
                    月別サマリー CSV
                  </button>
                  <button onClick={exportOrderDetailCSV} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition">
                    注文明細 CSV ({orders.length}件)
                  </button>
                  <button onClick={exportWithdrawalCSV} className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 transition">
                    出金明細 CSV ({withdrawals.length}件)
                  </button>
                  <button onClick={exportExpenseCSV} disabled={expenses.length === 0} className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition disabled:opacity-50">
                    経費明細 CSV ({expenses.length}件)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
