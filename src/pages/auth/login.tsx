import React, { useMemo, useState, useEffect } from 'react'
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
    return Boolean(import.meta.env.DEV) || localStorage.getItem(DEV_TOGGLE_KEY) === '1'
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
    () => [
      { label: 'テスト従業員（aasu6409@gmail.com）', email: 'aasu6409@gmail.com' },
      { label: 'テスト依頼者（m1k3y.bs@gmail.com）', email: 'm1k3y.bs@gmail.com' },
      { label: '管理者（gemusuke.official@gmail.com）', email: 'gemusuke.official@gmail.com' },
    ],
    []
  )

  /**
   * ログイン成功後、プロフィール取得完了を待ってから遷移する
   * useAuth の userProfile が更新されるのを useEffect で監視
   */
  useEffect(() => {
    if (!user || !userProfile || loading) return

    const role = normalizeRole(userProfile.role)
    console.log('[LoginPage] profile ready, navigating. role=', role)

    if (role === 'admin') navigate('/dashboard/admin', { replace: true })
    else if (role === 'employee') navigate('/dashboard/employee', { replace: true })
    else navigate('/dashboard/customer', { replace: true })
  }, [user, userProfile, loading, navigate])

  async function signIn(targetEmail: string, targetPassword: string) {
    setErrorMsg(null)
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: targetEmail.trim(),
        password: targetPassword,
      })

      if (error) {
        setErrorMsg(error.message)
        setSubmitting(false)
        return
      }

      // ここでは遷移しない。
      // onAuthStateChange → fetchUserProfile → userProfile更新 → useEffectで遷移
      // submitting は遷移するまで true のままにしてボタン連打を防ぐ
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'ログインに失敗しました')
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
    const pw = window.prompt(
      `DEVテストログイン\n${targetEmail}\nパスワードを入力してください`,
      prev
    )
    if (!pw) return
    sessionStorage.setItem(storageKey, pw)
    await signIn(targetEmail, pw)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700">
      <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-xl border border-white/15 shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="text-white text-2xl font-bold">GameBoost</div>
          <div className="text-white/90 text-lg font-semibold mt-2">アカウントにログイン</div>
          <div className="text-white/70 text-sm mt-1">
            まだアカウントをお持ちでない方は{' '}
            <Link className="underline" to="/register">新規登録</Link>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-500/20 border border-red-400/30 text-red-100 px-3 py-2 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-white/80 text-sm mb-1">メールアドレス</label>
            <input
              className="w-full rounded-lg px-3 py-2 bg-white/15 text-white placeholder-white/40 border border-white/20 outline-none focus:border-white/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-1">パスワード</label>
            <input
              className="w-full rounded-lg px-3 py-2 bg-white/15 text-white placeholder-white/40 border border-white/20 outline-none focus:border-white/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              type="password"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 rounded-lg py-2 font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {showDevQuickLogin && (
          <div className="mt-4 space-y-2">
            {quickLogins.map((q) => (
              <button
                key={q.email}
                disabled={submitting}
                onClick={() => handleQuickLogin(q.email)}
                className="w-full rounded-lg py-2 font-medium text-white/95 border border-white/25 bg-white/10 hover:bg-white/15 disabled:opacity-60"
              >
                {q.label}
              </button>
            ))}
            <div className="text-xs text-white/60 mt-2">
              DEVテスト用ボタン（<code>?dev=1</code> でON / <code>?dev=0</code> でOFF）
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-white/70 text-sm">
          <Link className="underline" to="/forgot-password">パスワードを忘れた方はこちら</Link>
        </div>
      </div>
    </div>
  )
}
