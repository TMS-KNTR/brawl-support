import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Header from '../home/components/Header'
import Footer from '../home/components/Footer'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 pt-[72px]">
        <div className="w-full max-w-sm">
          <h1 className="text-[20px] font-bold text-[#111] text-center mb-2">パスワードをリセット</h1>
          <p className="text-[13px] text-[#888] text-center mb-6">
            登録済みのメールアドレスにリセットリンクを送信します
          </p>

          {sent ? (
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 text-center">
              <i className="ri-mail-check-line text-3xl text-[#059669] mb-3 block"></i>
              <p className="text-[14px] font-semibold text-[#111] mb-1.5">メールを送信しました</p>
              <p className="text-[12px] text-[#666] mb-4">
                {email} にパスワードリセットリンクを送信しました。メールを確認してください。
              </p>
              <Link to="/login"
                className="inline-block px-5 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors">
                ログインに戻る
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E5E5E5] p-6">
              {errorMsg && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5]">
                  <p className="text-[11px] text-[#DC2626]">{errorMsg}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-[#666] mb-1.5">メールアドレス</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors placeholder:text-[#CCC]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="w-full py-2.5 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? '送信中...' : 'リセットリンクを送信'}
              </button>

              <div className="mt-4 text-center">
                <Link to="/login" className="text-[11px] text-[#9CA3AF] hover:text-[#6366F1] transition-colors">
                  ログインに戻る
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
