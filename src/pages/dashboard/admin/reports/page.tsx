import { useEffect, useState, useMemo } from 'react';
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
  type: string;          // 'earning' | 'withdrawal'
  status: string;        // 'pending' | 'completed' | 'rejected'
  created_at: string;
  description: string | null;
}

interface MonthlySummary {
  month: string;           // 'YYYY-MM'
  label: string;           // '2025年3月'
  grossSales: number;      // 総売上
  platformFee: number;     // プラットフォーム手数料
  refunds: number;         // 返金額
  employeePayouts: number; // 従業員支払額
  netRevenue: number;      // 純収益 (platformFee - refunds のうち手数料分)
  orderCount: number;
  completedCount: number;
  cancelledCount: number;
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

/** 確定申告の年度区分 (1月〜12月) */
function getFiscalYearRange(year: number): { from: string; to: string } {
  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

function formatCurrency(n: number) {
  return `¥${n.toLocaleString()}`;
}

function downloadCSV(filename: string, csvContent: string) {
  const bom = '\uFEFF'; // Excel用 BOM
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

  // 年度選択 (デフォルトは今年)
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [feeRate, setFeeRate] = useState(0.2);
  const [loading, setLoading] = useState(true);

  // --- Data fetch ---
  useEffect(() => { loadData(); }, [selectedYear, useCustomRange, customFrom, customTo]);

  async function loadData() {
    setLoading(true);

    const range = useCustomRange && customFrom && customTo
      ? { from: customFrom, to: customTo }
      : getFiscalYearRange(selectedYear);

    try {
      const result = await invokeEdgeFunction<{ success: boolean; data?: { orders: Order[]; withdrawals: Withdrawal[]; fee_rate: number }; error?: string }>('admin-api', {
        action: 'get-reports',
        from_date: range.from,
        to_date: range.to,
      });
      if (!result.success) throw new Error(result.error || 'レポートの取得に失敗しました');
      setOrders(result.data?.orders ?? []);
      setWithdrawals(result.data?.withdrawals ?? []);
      if (result.data?.fee_rate != null) {
        setFeeRate(result.data.fee_rate);
      }
    } catch (e: any) {
      console.error('レポート取得エラー:', e);
    }
    setLoading(false);
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

    // Sort chronologically
    const sorted = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    sorted.forEach(s => {
      s.netRevenue = s.platformFee; // プラットフォーム手数料 = 純収益
    });
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

  // --- CSV Export: 月別サマリー ---
  function exportMonthlySummaryCSV() {
    const header = '年月,総売上(税込),プラットフォーム手数料,返金額,従業員支払額,純収益(手数料収入),注文数,完了数,キャンセル数';
    const rows = monthlySummaries.map(s =>
      `${s.label},${s.grossSales},${s.platformFee},${s.refunds},${s.employeePayouts},${s.netRevenue},${s.orderCount},${s.completedCount},${s.cancelledCount}`
    );
    // 合計行
    rows.push(`合計,${totals.grossSales},${totals.platformFee},${totals.refunds},${totals.employeePayouts},${totals.netRevenue},${totals.orderCount},${totals.completedCount},${totals.cancelledCount}`);
    const csv = [header, ...rows].join('\n');
    const label = useCustomRange ? `${customFrom}_${customTo}` : `${selectedYear}`;
    downloadCSV(`売上レポート_月別_${label}.csv`, csv);
  }

  // --- CSV Export: 注文明細 ---
  function exportOrderDetailCSV() {
    const header = '注文ID,ステータス,金額,プラットフォーム手数料,返金済,支払済,ゲーム,注文日時';
    const rows = orders.map(o => {
      const fee = o.platform_fee ?? Math.round((o.price || 0) * feeRate);
      return `${o.id},${o.status},${o.price || 0},${fee},${o.is_refunded ? 'はい' : 'いいえ'},${o.is_paid_out ? 'はい' : 'いいえ'},${o.game_title || ''},${o.created_at}`;
    });
    const csv = [header, ...rows].join('\n');
    const label = useCustomRange ? `${customFrom}_${customTo}` : `${selectedYear}`;
    downloadCSV(`注文明細_${label}.csv`, csv);
  }

  // --- CSV Export: 出金明細 ---
  function exportWithdrawalCSV() {
    const header = '出金ID,ユーザーID,金額,種別,ステータス,説明,日時';
    const rows = withdrawals.map(w =>
      `${w.id},${w.user_id},${w.amount},${w.type},${w.status},${(w.description || '').replace(/,/g, ' ')},${w.created_at}`
    );
    const csv = [header, ...rows].join('\n');
    const label = useCustomRange ? `${customFrom}_${customTo}` : `${selectedYear}`;
    downloadCSV(`出金明細_${label}.csv`, csv);
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

  // --- Year options ---
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

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <button onClick={() => navigate('/dashboard/admin')} className="text-purple-600 hover:underline text-sm mb-2 block">
            ← 管理者ダッシュボード
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <StatCard label="総売上" value={formatCurrency(totals.grossSales)} color="text-blue-600" sub="キャンセル除く" />
                <StatCard label="手数料収入 (純収益)" value={formatCurrency(totals.platformFee)} color="text-green-600" sub={`手数料率 ${(feeRate * 100).toFixed(0)}%`} />
                <StatCard label="返金額" value={formatCurrency(totals.refunds)} color="text-red-600" />
                <StatCard label="従業員支払" value={formatCurrency(totals.employeePayouts)} color="text-orange-600" sub={`出金済 ${formatCurrency(totals.withdrawalTotal)}`} />
                <StatCard label="注文数" value={`${totals.completedCount} / ${totals.orderCount}`} sub={`完了 / 全体 (取消 ${totals.cancelledCount})`} />
              </div>

              {/* ---- 確定申告用サマリー ---- */}
              <div className="bg-white rounded-lg shadow-sm p-5 mb-8 border-l-4 border-green-500">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">確定申告用サマリー</h2>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b"><td className="py-2 text-gray-600">売上高 (総取引額)</td><td className="py-2 text-right font-mono font-semibold">{formatCurrency(totals.grossSales)}</td></tr>
                    <tr className="border-b"><td className="py-2 text-gray-600">うちプラットフォーム手数料収入</td><td className="py-2 text-right font-mono font-semibold text-green-600">{formatCurrency(totals.platformFee)}</td></tr>
                    <tr className="border-b"><td className="py-2 text-gray-600">返金・キャンセル額</td><td className="py-2 text-right font-mono font-semibold text-red-600">-{formatCurrency(totals.refunds)}</td></tr>
                    <tr className="border-b"><td className="py-2 text-gray-600">従業員への支払額 (外注費)</td><td className="py-2 text-right font-mono font-semibold text-orange-600">-{formatCurrency(totals.employeePayouts)}</td></tr>
                    <tr><td className="py-2 text-gray-900 font-semibold">差引利益 (手数料収入 - 返金)</td><td className="py-2 text-right font-mono font-bold text-green-700 text-lg">{formatCurrency(totals.platformFee - totals.refunds)}</td></tr>
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-3">※ Stripe決済手数料等は別途Stripeダッシュボードから取得してください</p>
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
                  <button onClick={exportMonthlySummaryCSV} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition">
                    月別サマリー CSV
                  </button>
                  <button onClick={exportOrderDetailCSV} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition">
                    注文明細 CSV ({orders.length}件)
                  </button>
                  <button onClick={exportWithdrawalCSV} className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 transition">
                    出金明細 CSV ({withdrawals.length}件)
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
