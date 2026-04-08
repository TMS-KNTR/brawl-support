import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AuthBackground } from './login'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setErrorMsg('メールアドレスを入力してください')
      return
    }
    setErrorMsg(null)
    setSubmitting(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
        style={{ background: 'linear-gradient(160deg, #EEF2FF 0%, #FAFAFA 60%, #EEF2FF 100%)' }}>
        <AuthBackground />

        <style>{`
          @keyframes fp-fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div className="relative z-10 w-full max-w-[400px]">
          {/* Logo */}
          <div className="text-center mb-8" style={{ animation: 'fp-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <Link to="/" className="inline-flex items-center group">
              <img src="/logo.png" alt="げむ助" className="h-20 w-auto" />
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-[#E0E7FF] p-6 sm:p-8 bg-white text-center"
            style={{
              boxShadow: '0 20px 60px rgba(99,102,241,0.06), 0 4px 16px rgba(0,0,0,0.04)',
              animation: 'fp-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
            }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#EEF2FF]">
              <i className="ri-mail-check-line text-[22px] text-[#6366F1]"></i>
            </div>
            <h2 className="text-[18px] font-bold text-[#1A1A2E] mb-2"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}>メールを送信しました</h2>
            <p className="text-[13px] text-[#6B7280] leading-relaxed"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}>
              {email} にパスワードリセットリンクを送信しました。<br />メールを確認してください。
            </p>
            <div className="mt-6">
              <Link to="/login"
                className="fp-btn inline-block w-full py-3 text-[12px] font-bold tracking-[0.08em] uppercase bg-[#6366F1] text-white rounded-lg"
                style={{ fontFamily: '"Orbitron", sans-serif' }}>
                ログインに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #EEF2FF 0%, #FAFAFA 60%, #EEF2FF 100%)' }}>
      <Helmet>
        <title>パスワードリセット | げむ助</title>
        <meta name="description" content="げむ助のパスワードをリセットします。登録済みのメールアドレスにリセットリンクを送信します。" />
        <link rel="canonical" href="https://gemusuke.com/forgot-password" />
      </Helmet>
      <AuthBackground />

      <style>{`
        @keyframes fp-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fp-card {
          animation: fp-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .fp-btn {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fp-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(99,102,241,0.25);
        }
        .fp-input {
          transition: all 0.25s ease;
        }
        .fp-input:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
      `}</style>

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8" style={{ animation: 'fp-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <Link to="/" className="inline-flex items-center group">
            <img src="/logo.png" alt="げむ助" className="h-20 w-auto" />
          </Link>
        </div>

        {/* Card */}
        <div className="fp-card rounded-2xl border border-[#E0E7FF] p-6 sm:p-8 bg-white"
          style={{
            boxShadow: '0 20px 60px rgba(99,102,241,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}>
          <div className="mb-6">
            <h1
              className="text-[20px] font-bold text-[#1A1A2E]"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}
            >
              パスワードをリセット
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-1" style={{ fontFamily: '"Rajdhani", sans-serif' }}>
              登録済みのメールアドレスにリセットリンクを送信します
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
                className="fp-input w-full border border-[#E0E7FF] rounded-lg p-3 text-[13px] text-[#1A1A2E] bg-[#F9FAFB] focus:outline-none placeholder:text-[#9CA3AF]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="fp-btn w-full py-3 text-[12px] font-bold tracking-[0.08em] uppercase bg-[#6366F1] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              {submitting ? '送信中...' : 'リセットリンクを送信'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login"
              className="text-[11px] text-[#9CA3AF] hover:text-[#6366F1] transition-colors"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}>
              ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
