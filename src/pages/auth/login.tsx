import React, { useMemo, useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { normalizeRole } from '../../hooks/useAuth'

const DEV_TOGGLE_KEY = 'show_dev_quick_login'

function resolveShowDevQuickLogin(): boolean {
  try {
    const params = new URLSearchParams(window.location.search)
    const devParam = params.get('dev')
    if (devParam === '1') localStorage.setItem(DEV_TOGGLE_KEY, '1')
    if (devParam === '0') localStorage.removeItem(DEV_TOGGLE_KEY)
    return Boolean(import.meta.env.DEV) && localStorage.getItem(DEV_TOGGLE_KEY) === '1'
  } catch {
    return false
  }
}

type QuickLogin = { label: string; email: string }

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, userProfile, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const showDevQuickLogin = resolveShowDevQuickLogin()

  const quickLogins: QuickLogin[] = useMemo(
    () => import.meta.env.DEV
      ? [
          { label: 'テスト従業員', email: import.meta.env.VITE_DEV_EMAIL_EMPLOYEE || '' },
          { label: 'テスト依頼者', email: import.meta.env.VITE_DEV_EMAIL_CUSTOMER || '' },
          { label: '管理者', email: import.meta.env.VITE_DEV_EMAIL_ADMIN || '' },
        ].filter(q => q.email)
      : [],
    []
  )

  useEffect(() => {
    if (!user || !userProfile || loading) return
    if (userProfile.is_banned) {
      setErrorMsg('このアカウントは停止されています。お問い合わせください。')
      supabase.auth.signOut()
      return
    }
    const role = normalizeRole(userProfile.role)
    if (role === 'admin') navigate('/dashboard/admin', { replace: true })
    else if (role === 'employee') navigate('/dashboard/employee', { replace: true })
    else navigate('/dashboard/customer', { replace: true })
  }, [user, userProfile, loading, navigate])

  async function signIn(targetEmail: string, targetPassword: string) {
    setErrorMsg(null)
    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail.trim(),
        password: targetPassword,
      })
      if (error) {
        setErrorMsg(error.message)
        setSubmitting(false)
        return
      }
      // ログイン成功 → プロフィールを取得して即ナビゲーション
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_banned')
          .eq('id', data.user.id)
          .single()
        if (profile?.is_banned) {
          await supabase.auth.signOut()
          setErrorMsg('このアカウントは停止されています。お問い合わせください。')
          setSubmitting(false)
          return
        }
        const role = normalizeRole(profile?.role)
        if (role === 'admin') navigate('/dashboard/admin', { replace: true })
        else if (role === 'employee') navigate('/dashboard/employee', { replace: true })
        else navigate('/dashboard/customer', { replace: true })
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'ログインに失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMsg('メールアドレスとパスワードを入力してください')
      return
    }
    await signIn(email, password)
  }

  async function handleQuickLogin(targetEmail: string) {
    setErrorMsg(null)
    const storageKey = `dev_pw:${targetEmail}`
    const prev = sessionStorage.getItem(storageKey) ?? ''
    const pw = window.prompt(`DEVテストログイン\n${targetEmail}\nパスワードを入力してください`, prev)
    if (!pw) return
    sessionStorage.setItem(storageKey, pw)
    await signIn(targetEmail, pw)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #EEF2FF 0%, #FAFAFA 60%, #EEF2FF 100%)' }}>
      <Helmet>
        <title>ログイン | GEMSUKE</title>
        <meta name="description" content="GEMSUKEにログインして、ブロスタの代行依頼を管理しましょう。" />
        <link rel="canonical" href="https://gemsuke.com/login" />
      </Helmet>
      <AuthBackground />

      <style>{`
        @keyframes auth-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-card {
          animation: auth-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .auth-btn {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .auth-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(99,102,241,0.25);
        }
        .auth-input {
          transition: all 0.25s ease;
        }
        .auth-input:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
      `}</style>

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8" style={{ animation: 'auth-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 border border-[#6366F1]/20 rounded-lg flex items-center justify-center group-hover:border-[#6366F1]/40 transition-colors">
              <i className="ri-gamepad-fill text-[#6366F1] text-sm"></i>
            </div>
            <span
              className="text-[15px] font-bold tracking-[0.15em] text-[#1A1A2E]"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              GEMSUKE
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="auth-card rounded-2xl border border-[#E0E7FF] p-6 sm:p-8 bg-white"
          style={{
            boxShadow: '0 20px 60px rgba(99,102,241,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}>
          <div className="mb-6">
            <h1
              className="text-[20px] font-bold text-[#1A1A2E]"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}
            >
              ログイン
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-1" style={{ fontFamily: '"Rajdhani", sans-serif' }}>
              アカウントをお持ちでない方は{' '}
              <Link to="/register" className="text-[#6366F1] font-semibold hover:text-[#4F46E5] transition-colors">
                新規登録
              </Link>
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 text-[12px] font-medium"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}>
              <i className="ri-error-warning-line mr-1.5"></i>{errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] mb-1.5 tracking-wider uppercase"
                style={{ fontFamily: '"Rajdhani", sans-serif' }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                className="auth-input w-full border border-[#E0E7FF] rounded-lg p-3 text-[13px] text-[#1A1A2E] bg-[#F9FAFB] focus:outline-none placeholder:text-[#9CA3AF]"
                style={{ fontFamily: '"Rajdhani", sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] mb-1.5 tracking-wider uppercase"
                style={{ fontFamily: '"Rajdhani", sans-serif' }}>
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="auth-input w-full border border-[#E0E7FF] rounded-lg p-3 text-[13px] text-[#1A1A2E] bg-[#F9FAFB] focus:outline-none placeholder:text-[#9CA3AF]"
                style={{ fontFamily: '"Rajdhani", sans-serif' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="auth-btn w-full py-3 text-[12px] font-bold tracking-[0.08em] uppercase bg-[#6366F1] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              {submitting ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password"
              className="text-[11px] text-[#9CA3AF] hover:text-[#6366F1] transition-colors"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}>
              パスワードを忘れた方はこちら
            </Link>
          </div>
        </div>

        {/* Dev quick login */}
        {showDevQuickLogin && (
          <div className="mt-4 rounded-2xl border border-[#E0E7FF] p-4 bg-white/80"
            style={{
              backdropFilter: 'blur(12px)',
              animation: 'auth-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both',
            }}>
            <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-[0.2em] mb-3"
              style={{ fontFamily: '"Orbitron", sans-serif' }}>
              Dev Quick Login
            </p>
            <div className="space-y-1.5">
              {quickLogins.map((q) => (
                <button
                  key={q.email}
                  disabled={submitting}
                  onClick={() => handleQuickLogin(q.email)}
                  className="w-full py-2 px-3 text-[11px] font-medium text-[#6B7280] border border-[#E0E7FF] rounded-lg hover:bg-[#EEF2FF] hover:text-[#6366F1] hover:border-[#C7D2FE] transition-all disabled:opacity-50 cursor-pointer text-left"
                  style={{ fontFamily: '"Rajdhani", sans-serif' }}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-[#9CA3AF] mt-2">
              <code>?dev=1</code> でON / <code>?dev=0</code> でOFF
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Soft background with grid pattern ── */
function AuthBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <style>{`
        @keyframes auth-grid-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* Grid pattern */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          animation: 'auth-grid-pulse 8s ease-in-out infinite',
        }} />
    </div>
  )
}

export { AuthBackground }
