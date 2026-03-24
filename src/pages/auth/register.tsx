import { useState, useRef, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { return () => { if (redirectTimer.current) clearTimeout(redirectTimer.current) } }, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordChecks = [
    { test: (p: string) => p.length >= 8, label: '8文字以上' },
    { test: (p: string) => /[a-zA-Z]/.test(p), label: '英字を含む' },
    { test: (p: string) => /[0-9]/.test(p), label: '数字を含む' },
  ]
  const allChecksPassed = passwordChecks.every((c) => c.test(password))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('メールアドレスを入力してください'); return }
    if (!allChecksPassed) { setError('パスワード要件を満たしてください'); return }
    if (password !== confirmPassword) { setError('パスワードが一致しません'); return }

    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {},
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (signUpError) throw signUpError
      setSuccess(true)
      redirectTimer.current = setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.message || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(160deg, #EEF2FF 0%, #FAFAFA 60%, #EEF2FF 100%)' }}>
        <RegisterBackground />
        <div className="relative z-10 w-full max-w-[400px]"
          style={{ animation: 'reg-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <style>{`
            @keyframes reg-fadeUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div className="rounded-2xl border border-[#E0E7FF] p-8 text-center bg-white"
            style={{
              boxShadow: '0 20px 60px rgba(99,102,241,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#EEF2FF]">
              <i className="ri-check-line text-[22px] text-[#6366F1]"></i>
            </div>
            <h2 className="text-[18px] font-bold text-[#1A1A2E] mb-2"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}>登録完了</h2>
            <p className="text-[13px] text-[#6B7280] leading-relaxed"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}>
              確認メールを送信しました。<br />メール内のリンクをクリックしてアカウントを有効化してください。
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-4">3秒後にログインページに移動します...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #EEF2FF 0%, #FAFAFA 60%, #EEF2FF 100%)' }}>
      <Helmet>
        <title>新規登録 | GEMUSUKE - ゲーム代行サービス</title>
        <meta name="description" content="げむ助に無料登録。ブロスタのランク上げ・トロフィー上げ代行をすぐに依頼できます。" />
        <link rel="canonical" href="https://gemsuke.com/register" />
      </Helmet>
      <RegisterBackground />

      <style>{`
        @keyframes reg-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reg-card {
          animation: reg-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .reg-btn {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reg-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(99,102,241,0.25);
        }
        .reg-input {
          transition: all 0.25s ease;
        }
        .reg-input:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
      `}</style>

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8" style={{ animation: 'reg-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 border border-[#6366F1]/20 rounded-lg flex items-center justify-center group-hover:border-[#6366F1]/40 transition-colors">
              <i className="ri-gamepad-fill text-[#6366F1] text-sm"></i>
            </div>
            <span
              className="text-[15px] font-bold tracking-[0.15em] text-[#1A1A2E]"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              GEMUSUKE
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="reg-card rounded-2xl border border-[#E0E7FF] p-6 sm:p-8 bg-white"
          style={{
            boxShadow: '0 20px 60px rgba(99,102,241,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}>
          <div className="mb-6">
            <h1
              className="text-[20px] font-bold text-[#1A1A2E]"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}
            >
              新規登録
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-1" style={{ fontFamily: '"Rajdhani", sans-serif' }}>
              すでにアカウントをお持ちの方は{' '}
              <Link to="/login" className="text-[#6366F1] font-semibold hover:text-[#4F46E5] transition-colors">
                ログイン
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 text-[12px] font-medium"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}>
              <i className="ri-error-warning-line mr-1.5"></i>{error}
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
                className="reg-input w-full border border-[#E0E7FF] rounded-lg p-3 text-[13px] text-[#1A1A2E] bg-[#F9FAFB] focus:outline-none placeholder:text-[#9CA3AF]"
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
                autoComplete="new-password"
                placeholder="8文字以上・英字+数字"
                className="reg-input w-full border border-[#E0E7FF] rounded-lg p-3 text-[13px] text-[#1A1A2E] bg-[#F9FAFB] focus:outline-none placeholder:text-[#9CA3AF]"
              />
              {password && (
                <div className="flex gap-3 mt-2">
                  {passwordChecks.map((c) => (
                    <span key={c.label} className={`text-[10px] font-medium flex items-center gap-1 ${c.test(password) ? 'text-[#6366F1]' : 'text-[#9CA3AF]'}`}>
                      <i className={`${c.test(password) ? 'ri-check-line' : 'ri-close-line'} text-[10px]`}></i>
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] mb-1.5 tracking-wider uppercase"
                style={{ fontFamily: '"Rajdhani", sans-serif' }}>
                パスワード（確認）
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="もう一度入力"
                className="reg-input w-full border border-[#E0E7FF] rounded-lg p-3 text-[13px] text-[#1A1A2E] bg-[#F9FAFB] focus:outline-none placeholder:text-[#9CA3AF]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="reg-btn w-full py-3 text-[12px] font-bold tracking-[0.08em] uppercase bg-[#6366F1] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line text-[14px] animate-spin"></i>
                  登録中...
                </span>
              ) : (
                'アカウントを作成'
              )}
            </button>
          </form>

          <p className="mt-4 text-[10px] text-[#9CA3AF] text-center leading-relaxed"
            style={{ fontFamily: '"Rajdhani", sans-serif' }}>
            登録することで、
            <Link to="/legal/terms" className="text-[#6B7280] hover:text-[#6366F1] transition-colors">利用規約</Link>
            および
            <Link to="/legal/privacy" className="text-[#6B7280] hover:text-[#6366F1] transition-colors">プライバシーポリシー</Link>
            に同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Soft background with grid pattern ── */
function RegisterBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <style>{`
        @keyframes reg-grid-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* Grid pattern */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          animation: 'reg-grid-pulse 8s ease-in-out infinite',
        }} />
    </div>
  )
}
