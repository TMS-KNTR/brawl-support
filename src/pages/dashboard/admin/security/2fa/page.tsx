import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../../lib/supabase';
import Header from '../../../../home/components/Header';
import Footer from '../../../../home/components/Footer';
import ProtectedRoute from '../../../../../components/base/ProtectedRoute';

type FactorInfo = {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
};

type EnrollState = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

export default function Admin2FAPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<FactorInfo[]>([]);
  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    loadFactors();
  }, []);

  async function loadFactors() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totpFactors = (data?.totp ?? []).map((f: any) => ({
        id: f.id,
        friendly_name: f.friendly_name,
        factor_type: f.factor_type,
        status: f.status,
        created_at: f.created_at,
      }));
      setFactors(totpFactors);
    } catch (e: any) {
      setErrorMsg(translateError(e?.message));
    } finally {
      setLoading(false);
    }
  }

  async function startEnroll() {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const friendlyName = `Admin TOTP ${new Date().toISOString().slice(0, 10)}`;
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName,
      });
      if (error) throw error;
      if (!data) throw new Error('登録情報を取得できませんでした');
      setEnroll({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
      setCode('');
    } catch (e: any) {
      setErrorMsg(translateError(e?.message));
    }
  }

  async function verifyEnroll() {
    if (!enroll) return;
    if (!/^\d{6}$/.test(code)) {
      setErrorMsg('6桁の数字を入力してください');
      return;
    }
    setVerifying(true);
    setErrorMsg(null);
    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enroll.factorId,
        challengeId: challengeData!.id,
        code,
      });
      if (verifyError) throw verifyError;
      setEnroll(null);
      setCode('');
      setSuccessMsg('2段階認証を有効化しました。次回ログイン時から6桁コードが必要になります。');
      await loadFactors();
    } catch (e: any) {
      setErrorMsg(translateError(e?.message));
    } finally {
      setVerifying(false);
    }
  }

  async function cancelEnroll() {
    if (!enroll) return;
    try {
      await supabase.auth.mfa.unenroll({ factorId: enroll.factorId });
    } catch {
      /* ignore */
    }
    setEnroll(null);
    setCode('');
    setErrorMsg(null);
    await loadFactors();
  }

  async function removeFactor(factorId: string) {
    if (!window.confirm('この2段階認証を削除しますか？削除すると次回ログイン時から6桁コードが不要になります。')) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setSuccessMsg('2段階認証を削除しました');
      await loadFactors();
    } catch (e: any) {
      setErrorMsg(translateError(e?.message));
    }
  }

  async function copySecret() {
    if (!enroll) return;
    try {
      await navigator.clipboard.writeText(enroll.secret);
      setSuccessMsg('シークレットをコピーしました');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch {
      setErrorMsg('コピーに失敗しました。手動でコピーしてください。');
    }
  }

  const verifiedFactors = factors.filter((f) => f.status === 'verified');
  const hasFactor = verifiedFactors.length > 0;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-28 pb-8">
          <button
            onClick={() => navigate('/dashboard/admin')}
            className="text-purple-600 hover:underline text-sm mb-2"
          >
            ← 管理者ダッシュボード
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 管理者2段階認証</h1>
          <p className="text-gray-600 text-sm mb-6">
            管理者アカウントの不正ログインを防ぐため、認証アプリ（Google Authenticator など）で6桁コードによる追加認証を設定します。
          </p>

          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
              {successMsg}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              読み込み中...
            </div>
          ) : enroll ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">📱 認証アプリで読み取り</h2>
              <ol className="text-sm text-gray-700 space-y-2 mb-4 list-decimal list-inside">
                <li>スマホで Google Authenticator（または Authy / 1Password など）を開く</li>
                <li>「アカウントを追加」→「QRコードをスキャン」</li>
                <li>下のQRコードを読み取る</li>
                <li>アプリに表示された6桁を下のフォームに入力</li>
              </ol>

              <div className="flex flex-col items-center bg-gray-50 rounded-lg p-6 mb-4">
                <img
                  src={enroll.qrCode}
                  alt="2FA QR Code"
                  className="w-56 h-56 bg-white p-2 rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((s) => !s)}
                  className="mt-3 text-xs text-purple-600 hover:underline"
                >
                  {showSecret ? 'シークレットを隠す' : 'QRが読めない場合はこちら'}
                </button>
                {showSecret && (
                  <div className="mt-2 w-full">
                    <p className="text-xs text-gray-500 mb-1">手動入力用シークレット：</p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-xs font-mono break-all">
                        {enroll.secret}
                      </code>
                      <button
                        onClick={copySecret}
                        className="px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        コピー
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                アプリに表示された6桁コード
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-purple-500"
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={verifyEnroll}
                  disabled={verifying || code.length !== 6}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? '確認中...' : '登録を完了'}
                </button>
                <button
                  onClick={cancelEnroll}
                  disabled={verifying}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    hasFactor ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <p className="font-medium">
                  {hasFactor ? '2段階認証は有効です' : '2段階認証は未設定です'}
                </p>
              </div>

              {hasFactor ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    登録済みの認証アプリで6桁コードを生成し、ログイン時に入力してください。
                  </p>
                  <div className="border border-gray-200 rounded-lg divide-y">
                    {verifiedFactors.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">{f.friendly_name || 'TOTP'}</p>
                          <p className="text-xs text-gray-500">
                            登録: {new Date(f.created_at).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFactor(f.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900">
                    <p className="font-bold mb-1">⚠️ スマホ紛失時の復旧</p>
                    <p>
                      認証アプリにアクセスできなくなった場合、別の管理者またはデータベース管理者に依頼して、認証要素を削除してもらってください。
                      予備として、シークレットを安全な場所に保管しておくこともおすすめします。
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    パスワードだけでは不正アクセスのリスクがあります。今すぐ2段階認証を設定してください。
                  </p>
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900">
                    <p className="font-bold mb-1">必要なもの</p>
                    <p>スマホアプリ：Google Authenticator / Authy / Microsoft Authenticator / 1Password など</p>
                  </div>
                  <button
                    onClick={startEnroll}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700"
                  >
                    2段階認証を設定する
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

function translateError(message: string | undefined): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid totp code')) return '6桁コードが正しくありません。アプリの最新のコードを入力してください。';
  if (m.includes('rate limit')) return '試行回数が多すぎます。しばらく時間を置いてからお試しください。';
  if (m.includes('mfa') && m.includes('disabled')) return 'プロジェクトでMFAが有効になっていません。Supabaseダッシュボードで有効化してください。';
  if (m.includes('not authenticated')) return 'ログインし直してからお試しください。';
  return message || '操作に失敗しました。再度お試しください。';
}
