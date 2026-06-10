import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeRole } from '../../hooks/useAuth';
import { AuthBackground } from './login';

export default function MfaChallengePage() {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) AAL: aal2に既に到達済みならスキップ
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!mounted) return;
        if (aalData?.currentLevel === 'aal2') {
          redirectByRole();
          return;
        }
        if (aalData?.nextLevel !== 'aal2') {
          // MFA未設定 → そもそもチャレンジ不要
          redirectByRole();
          return;
        }

        // 2) factorId取得
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (!mounted) return;
        const verified = (factors?.totp ?? []).find((f: any) => f.status === 'verified');
        if (!verified) {
          redirectByRole();
          return;
        }
        setFactorId(verified.id);
      } catch (e: any) {
        if (mounted) setErrorMsg('認証情報の取得に失敗しました。再ログインしてください。');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function redirectByRole() {
    const role = normalizeRole(userProfile?.role);
    if (role === 'admin') navigate('/dashboard/admin', { replace: true });
    else if (role === 'employee') navigate('/dashboard/employee', { replace: true });
    else navigate('/dashboard/customer', { replace: true });
  }

  async function verify() {
    if (!factorId) return;
    if (!/^\d{6}$/.test(code)) {
      setErrorMsg('6桁の数字を入力してください');
      return;
    }
    setVerifying(true);
    setErrorMsg(null);
    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge!.id,
        code,
      });
      if (verifyError) throw verifyError;
      redirectByRole();
    } catch (e: any) {
      const m = (e?.message ?? '').toLowerCase();
      if (m.includes('invalid totp code')) {
        setErrorMsg('6桁コードが正しくありません。アプリの最新のコードを入力してください。');
      } else if (m.includes('rate limit')) {
        setErrorMsg('試行回数が多すぎます。しばらく時間を置いてからお試しください。');
      } else {
        setErrorMsg('認証に失敗しました。再度お試しください。');
      }
    } finally {
      setVerifying(false);
    }
  }

  async function cancel() {
    await signOut();
    navigate('/login', { replace: true });
  }

  // 未ログインなら/loginへ
  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #EEF2FF 0%, #FAFAFA 60%, #EEF2FF 100%)' }}
    >
      <Helmet>
        <title>2段階認証 | げむ助</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <AuthBackground />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center">
            <img src="/logo.png" alt="げむ助" className="h-20 w-auto" />
          </Link>
        </div>

        <div
          className="rounded-2xl border border-[#E0E7FF] p-6 sm:p-8 bg-white"
          style={{ boxShadow: '0 20px 60px rgba(99,102,241,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <h1 className="text-[20px] font-bold text-[#1A1A2E] mb-1" style={{ fontFamily: '"Rajdhani", sans-serif' }}>
            2段階認証
          </h1>
          <p className="text-[13px] text-[#6B7280] mb-6" style={{ fontFamily: '"Rajdhani", sans-serif' }}>
            認証アプリに表示されている6桁コードを入力してください。
          </p>

          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 text-[12px] font-medium">
              <i className="ri-error-warning-line mr-1.5"></i>
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-500 py-6">読み込み中...</div>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && code.length === 6) verify();
                }}
                placeholder="123456"
                autoFocus
                className="w-full text-center text-3xl font-mono tracking-[0.5em] border border-[#E0E7FF] rounded-lg p-3 mb-4 bg-[#F9FAFB] focus:outline-none focus:border-[#6366F1]"
              />

              <button
                onClick={verify}
                disabled={verifying || code.length !== 6}
                className="w-full py-3 text-[12px] font-bold tracking-[0.08em] uppercase bg-[#6366F1] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: '"Orbitron", sans-serif' }}
              >
                {verifying ? '確認中...' : '認証する'}
              </button>

              <button
                onClick={cancel}
                disabled={verifying}
                className="w-full mt-3 py-2 text-[11px] text-[#9CA3AF] hover:text-[#6366F1] transition-colors"
              >
                キャンセル（ログアウト）
              </button>

              <p className="mt-4 text-[11px] text-[#9CA3AF] text-center">
                アプリにアクセスできない場合は管理者にお問い合わせください。
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
