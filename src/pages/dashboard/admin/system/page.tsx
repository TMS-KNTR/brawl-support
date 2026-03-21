import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, logAdminAction, invokeEdgeFunction } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

type Setting = { key: string; value: any; updated_at: string };

export default function AdminSystemPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ローカルステート
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [feeRate, setFeeRate] = useState(20);
  const [autoCancelHours, setAutoCancelHours] = useState(48);
  const [autoCancelResult, setAutoCancelResult] = useState<string | null>(null);
  const [runningAutoCancel, setRunningAutoCancel] = useState(false);
  const [ngWords, setNgWords] = useState<string[]>([]);
  const [newNgWord, setNewNgWord] = useState('');

  async function runAutoCancelNow() {
    if (!confirm('自動キャンセルを今すぐ実行しますか？\n対象: 支払済み・未受注で設定時間超過の注文')) return;
    setRunningAutoCancel(true);
    setAutoCancelResult(null);
    try {
      const result = await invokeEdgeFunction('auto-cancel-orders', {});
      setAutoCancelResult(JSON.stringify(result, null, 2));
    } catch (e: any) {
      setAutoCancelResult('エラー: ' + e.message);
    }
    setRunningAutoCancel(false);
  }

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) {
      console.error('system_settings取得エラー:', error);
      setLoading(false);
      return;
    }

    setSettings(data || []);

    for (const s of data || []) {
      if (s.key === 'maintenance_mode') setMaintenanceMode(s.value === true);
      if (s.key === 'platform_fee_rate') setFeeRate(Math.round(Number(s.value) * 100));
      if (s.key === 'auto_cancel_hours') setAutoCancelHours(Number(s.value) || 48);
      if (s.key === 'ng_words') {
        try {
          const words = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
          if (Array.isArray(words)) setNgWords(words);
        } catch { /* ignore */ }
      }
    }

    setLoading(false);
  }

  async function saveSetting(key: string, value: any, label: string) {
    setSaving(true);

    try {
      const result = await invokeEdgeFunction<{ success: boolean; error?: string }>('admin-api', {
        action: 'update-system-setting',
        key,
        value,
      });

      if (!result.success) {
        alert('保存エラー: ' + (result.error || '不明なエラー'));
      } else {
        await logAdminAction({
          action: 'system_setting_changed',
          targetType: 'system',
          targetId: key,
          details: `${label}を変更: ${JSON.stringify(value)}`,
          meta: { key, value },
        });
        alert(`${label}を保存しました`);
      }
    } catch (e: any) {
      alert('保存エラー: ' + (e.message || '不明なエラー'));
    }

    setSaving(false);
    loadSettings();
  }

  async function toggleMaintenance() {
    const newValue = !maintenanceMode;
    setMaintenanceMode(newValue);
    await saveSetting('maintenance_mode', newValue, 'メンテナンスモード');
  }

  async function saveFeeRate() {
    if (feeRate < 0 || feeRate > 100) {
      alert('手数料率は0〜100%の範囲で指定してください');
      return;
    }
    const rateDecimal = feeRate / 100;
    await saveSetting('platform_fee_rate', rateDecimal, 'プラットフォーム手数料率');
  }

  const stripeMode = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').startsWith('pk_live') ? '本番' : 'テスト';

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/dashboard/admin')} className="text-purple-600 hover:underline text-sm mb-2 block">← 管理者ダッシュボード</button>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">⚙ システム設定</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* メンテナンスモード */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">メンテナンスモード</h2>
                    <p className="text-sm text-gray-500">ONにすると新規注文・受注がブロックされます</p>
                  </div>
                  <button
                    onClick={toggleMaintenance}
                    disabled={saving}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-50 ${
                      maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        maintenanceMode ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {maintenanceMode && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">⚠ メンテナンスモードが有効です。新規注文・受注がブロックされています。</p>
                  </div>
                )}
              </div>

              {/* 手数料率 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">プラットフォーム手数料率</h2>
                <p className="text-sm text-gray-500 mb-4">注文金額からプラットフォームが受け取る割合です</p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={feeRate}
                      onChange={(e) => setFeeRate(Number(e.target.value))}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-bold"
                    />
                    <span className="text-gray-700 font-medium">%</span>
                  </div>
                  <button
                    onClick={saveFeeRate}
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm font-medium"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    例: 注文金額 ¥10,000 の場合
                  </p>
                  <div className="flex gap-6 mt-1 text-sm">
                    <span className="text-gray-500">プラットフォーム: <strong className="text-gray-900">¥{(10000 * feeRate / 100).toLocaleString()}</strong></span>
                    <span className="text-gray-500">従業員: <strong className="text-gray-900">¥{(10000 * (100 - feeRate) / 100).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* 自動キャンセル */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">注文の自動キャンセル</h2>
                <p className="text-sm text-gray-500 mb-4">
                  支払済みで未受注のまま指定時間が経過した注文を自動でキャンセル・返金します
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={autoCancelHours}
                      onChange={(e) => setAutoCancelHours(Number(e.target.value))}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-bold"
                    />
                    <span className="text-gray-700 font-medium">時間</span>
                  </div>
                  <button
                    onClick={() => {
                      if (autoCancelHours < 1 || autoCancelHours > 720) {
                        alert('1〜720時間の範囲で指定してください');
                        return;
                      }
                      saveSetting('auto_cancel_hours', autoCancelHours, '自動キャンセル時間');
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm font-medium"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    現在の設定: 支払済みから <strong>{autoCancelHours}時間</strong>（{(autoCancelHours / 24).toFixed(1)}日）経過で自動キャンセル
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    シーズン終盤は短めに設定することをお勧めします（例: 24時間）
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={runAutoCancelNow}
                    disabled={runningAutoCancel}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm font-medium"
                  >
                    {runningAutoCancel ? '実行中...' : '今すぐ実行（手動テスト）'}
                  </button>
                  <span className="text-xs text-gray-400">通常は1時間ごとに自動実行されます</span>
                </div>

                {autoCancelResult && (
                  <pre className="mt-3 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {autoCancelResult}
                  </pre>
                )}
              </div>

              {/* NGワード管理 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">NGワード管理</h2>
                <p className="text-sm text-gray-500 mb-4">
                  チャットで禁止するワードを管理します。検知時はブロック＋管理者に通知されます
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={newNgWord}
                    onChange={(e) => setNewNgWord(e.target.value)}
                    placeholder="NGワードを入力"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newNgWord.trim()) {
                        e.preventDefault();
                        const word = newNgWord.trim();
                        if (!ngWords.includes(word)) {
                          const updated = [...ngWords, word];
                          setNgWords(updated);
                          setNewNgWord('');
                          saveSetting('ng_words', JSON.stringify(updated), 'NGワード');
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const word = newNgWord.trim();
                      if (!word) return;
                      if (ngWords.includes(word)) { alert('既に登録されています'); return; }
                      const updated = [...ngWords, word];
                      setNgWords(updated);
                      setNewNgWord('');
                      saveSetting('ng_words', JSON.stringify(updated), 'NGワード');
                    }}
                    disabled={saving || !newNgWord.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm font-medium"
                  >
                    追加
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ngWords.map((word, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-800 px-3 py-1 rounded-full text-sm"
                    >
                      {word}
                      <button
                        onClick={() => {
                          const updated = ngWords.filter((_, idx) => idx !== i);
                          setNgWords(updated);
                          saveSetting('ng_words', JSON.stringify(updated), 'NGワード');
                        }}
                        className="text-red-400 hover:text-red-700 ml-1"
                        title="削除"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {ngWords.length === 0 && (
                    <p className="text-sm text-gray-400">NGワードが登録されていません</p>
                  )}
                </div>
              </div>

              {/* システム情報（読み取り専用） */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">システム情報</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">サービス状態</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${maintenanceMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {maintenanceMode ? 'メンテナンス中' : '稼働中'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">対応ゲーム</span>
                    <span className="text-gray-900 font-medium">Brawl Stars</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">決済</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${stripeMode === '本番' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      Stripe（{stripeMode}モード）
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">手数料率</span>
                    <span className="text-gray-900 font-medium">{feeRate}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">自動キャンセル</span>
                    <span className="text-gray-900 font-medium">{autoCancelHours}時間（{(autoCancelHours / 24).toFixed(1)}日）</span>
                  </div>
                </div>
              </div>

              {/* 最終更新 */}
              {settings.length > 0 && (
                <p className="text-xs text-gray-400 text-right">
                  最終更新: {new Date(Math.max(...settings.map(s => new Date(s.updated_at).getTime()))).toLocaleString('ja-JP')}
                </p>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
