import { useEffect, useState } from 'react';
import { invokeEdgeFunction } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

type EmployeeRating = {
  employee_id: string;
  name: string;
  avg: number;
  count: number;
};

type RatingDetail = {
  id: string;
  score: number;
  comment: string;
  created_at: string;
  user_name: string;
};

export default function AdminRatingsPage() {
  const [rows, setRows] = useState<EmployeeRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<RatingDetail[]>([]);
  const [detailsFor, setDetailsFor] = useState<{ id: string; name: string } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await invokeEdgeFunction<{ success: boolean; data?: any[]; error?: string }>('admin-api', { action: 'list-ratings' });
        if (!result.success) throw new Error(result.error || '評価の取得に失敗しました');
        const data = result.data || [];
        const map = new Map<string, { name: string; sum: number; count: number }>();
        data.forEach((r: any) => {
          const name = r.employee_id ? `${r.employee_id.slice(0, 8)}...` : '不明';
          const key = r.employee_id;
          const current = map.get(key) || { name, sum: 0, count: 0 };
          current.sum += r.score || 0;
          current.count += 1;
          map.set(key, current);
        });
        const rowsArr: EmployeeRating[] = Array.from(map.entries()).map(([employee_id, v]) => ({
          employee_id,
          name: v.name,
          avg: v.count > 0 ? v.sum / v.count : 0,
          count: v.count,
        }));
        rowsArr.sort((a, b) => {
          if (b.avg !== a.avg) return b.avg - a.avg;
          return b.count - a.count;
        });
        setRows(rowsArr);
      } catch (e: any) {
        console.error('従業員評価取得エラー:', e);
        setError(e.message || '評価の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchRatings();
  }, []);

  const openDetails = async (row: EmployeeRating) => {
    setDetailsFor({ id: row.employee_id, name: row.name });
    setDetails([]);
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const result = await invokeEdgeFunction<{ success: boolean; data?: any[]; error?: string }>('admin-api', { action: 'get-rating-detail', employee_id: row.employee_id });
      if (!result.success) throw new Error(result.error || '評価の取得に失敗しました');
      const data = result.data || [];
      const list: RatingDetail[] = data.map((r: any) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        created_at: r.created_at,
        user_name: r.user_id ? `${r.user_id.slice(0, 8)}...` : '不明',
      }));
      setDetails(list);
    } catch (e: any) {
      console.error('評価詳細取得エラー:', e);
      setDetailsError(e.message || '評価の取得に失敗しました');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">従業員の評価一覧</h1>
            <p className="text-gray-600 text-sm">
              各従業員の平均評価と件数を確認できます。
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 text-sm text-gray-500">読み込み中...</div>
            ) : error ? (
              <div className="p-6 text-sm text-red-600">エラー: {error}</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">まだ評価はありません。</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">従業員</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">平均評価</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">件数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr
                      key={r.employee_id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDetails(r)}
                    >
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2">
                        <span className="text-yellow-400 mr-1">
                          {'★'.repeat(Math.round(r.avg))}
                          <span className="text-gray-300">
                            {'★'.repeat(5 - Math.round(r.avg))}
                          </span>
                        </span>
                        <span className="text-gray-700">{r.avg.toFixed(1)} / 5</span>
                      </td>
                      <td className="px-4 py-2">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
        {/* 評価詳細モーダル */}
        {detailsFor && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {detailsFor.name} の評価一覧
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    最新50件まで表示します。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsFor(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {detailsLoading ? (
                  <div className="p-4 text-sm text-gray-500">読み込み中...</div>
                ) : detailsError ? (
                  <div className="p-4 text-sm text-red-600">エラー: {detailsError}</div>
                ) : details.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">まだ評価がありません。</div>
                ) : (
                  <ul className="divide-y divide-gray-100 text-sm">
                    {details.map((d) => (
                      <li key={d.id} className="px-5 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-yellow-400 text-base">
                            {'★'.repeat(d.score)}
                            <span className="text-gray-300">
                              {'★'.repeat(5 - d.score)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(d.created_at).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <p className="text-gray-800 whitespace-pre-line mb-1">{d.comment}</p>
                        <p className="text-xs text-gray-500">依頼者: {d.user_name}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

