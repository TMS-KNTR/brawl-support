import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (sessionId) {
      // Stripe Checkoutセッションが存在する = 決済ページから正常に戻ってきた
      // 実際のDB更新はstripe-webhook側で行われる（ここではUIだけ）
      setStatus('success')
    } else {
      setStatus('error')
    }
  }, [sessionId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">決済情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            決済情報が確認できません
          </h1>
          <p className="text-gray-600 mb-6">
            このページに直接アクセスした場合、決済情報を取得できません。
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-green-600">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">決済完了！</h1>
            <p className="text-xl text-gray-600 mb-6">
              Brawl Stars代行サービスのご注文ありがとうございます
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              次のステップ
            </h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">
                  1
                </div>
                <div>
                  <div className="font-semibold text-gray-900">確認メール送信</div>
                  <div className="text-gray-600 text-sm">
                    ご登録のメールアドレスに注文確認メールをお送りします
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">
                  2
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    担当者からご連絡
                  </div>
                  <div className="text-gray-600 text-sm">
                    24時間以内に担当者からご連絡いたします
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">
                  3
                </div>
                <div>
                  <div className="font-semibold text-gray-900">代行開始</div>
                  <div className="text-gray-600 text-sm">
                    アカウント情報確認後、代行サービスを開始します
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              to="/dashboard/customer"
              className="block w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-orange-700 transition-all duration-300"
            >
              注文状況を確認する
            </Link>
            <Link
              to="/"
              className="block w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:border-gray-400 transition-all duration-300"
            >
              ホームページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
