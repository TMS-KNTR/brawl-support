import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { invokeEdgeFunction } from '../../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function BrawlStarsOrderForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    serviceType: '',
    currentTrophies: '',
    targetTrophies: '',
    gameAccount: '',
    gamePassword: '',
    deviceType: 'android',
    additionalInfo: '',
    preferredTime: '',
    contactMethod: 'in-app',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [estimatedDuration, setEstimatedDuration] = useState<string>('')
  const [priceError, setPriceError] = useState<string | null>(null)

  /** 料金計算（Supabase Edge Function呼び出し） */
  const calculatePrice = async () => {
    if (!formData.serviceType || !formData.currentTrophies || !formData.targetTrophies) {
      return
    }

    setPriceError(null)

    try {
      const result = await invokeEdgeFunction('calculate-brawlstars-price', {
        serviceType: formData.serviceType,
        currentRank: formData.currentTrophies,
        targetRank: formData.targetTrophies,
      }, { requireAuth: false })

      if (result.success && result.data) {
        setEstimatedPrice(result.data.totalPrice)
        setEstimatedDuration(`約${Math.ceil(result.data.gauges / 100)}日`)
      } else {
        setPriceError(result.error || '料金計算に失敗しました')
      }
    } catch (error: any) {
      console.error('価格計算エラー:', error)
      setPriceError(error.message || '料金計算に失敗しました')
    }
  }

  /** 注文送信 */
  const handleSubmit = async (
    e: React.FormEvent,
    submitType: 'quote' | 'payment'
  ) => {
    e.preventDefault()

    if (!user) {
      navigate('/login')
      return
    }

    setIsSubmitting(true)

    try {
      if (submitType === 'payment') {
        // ===== Stripe決済フロー =====
        // create-order-payment Edge Function を呼ぶ
        // → 注文をDBに作成 → Stripe Checkout Session作成 → URLを返す
        const result = await invokeEdgeFunction('create-order-payment', {
          currentRank: formData.currentTrophies,
          targetRank: formData.targetTrophies,
          region: formData.deviceType,
          notes: [
            formData.serviceType,
            formData.additionalInfo,
            `希望時間: ${formData.preferredTime}`,
            `連絡方法: ${formData.contactMethod}`,
          ]
            .filter(Boolean)
            .join(' - '),
          credentials: {
            username: formData.gameAccount,
            password: formData.gamePassword,
            notes: `デバイス: ${formData.deviceType}`,
          },
          totalPrice: estimatedPrice || 0,
          subtotal: estimatedPrice ? Math.floor(estimatedPrice * 0.8) : 0,
          platformFee: estimatedPrice ? Math.floor(estimatedPrice * 0.2) : 0,
        })

        if (result.success && result.data?.checkoutUrl) {
          // Stripeの決済ページにリダイレクト
          window.location.href = result.data.checkoutUrl
        } else {
          throw new Error(result.error || '注文の作成に失敗しました')
        }
      } else {
        // ===== 見積もり依頼フロー（従来通りSupabase直接） =====
        const { supabase } = await import('../../../lib/supabase')

        const { data: orderData, error } = await supabase
          .from('orders')
          .insert([
            {
              customer_id: user.id,
              game_title: 'Brawl Stars',
              service_type: formData.serviceType,
              current_rank: formData.currentTrophies,
              target_rank: formData.targetTrophies,
              total_price: estimatedPrice || 0,
              status: 'pending',
            },
          ])
          .select()
          .single()

        if (error) throw error

        if (orderData) {
          const { error: chatError } = await supabase
            .from('chat_threads')
            .insert({
              order_id: orderData.id,
              participants: JSON.stringify([user.id]),
              last_message_at: new Date().toISOString(),
            })
          if (chatError) console.error('チャットスレッド作成エラー:', chatError)
        }

        if (formData.gameAccount && formData.gamePassword && orderData) {
          await supabase.from('credential_vaults').insert([
            {
              order_id: orderData.id,
              username: formData.gameAccount,
              password_encrypted: btoa(formData.gamePassword),
              notes: `デバイス: ${formData.deviceType}\n追加情報: ${formData.additionalInfo}`,
              masked_preview: `${formData.gameAccount.substring(0, 2)}***`,
              visible_to: JSON.stringify([]),
            },
          ])
        }

        setShowSuccess(true)
        setTimeout(() => navigate('/dashboard/customer'), 2000)
      }
    } catch (error: any) {
      console.error('送信エラー:', error)
      alert(error.message || '送信に失敗しました。再度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (['serviceType', 'currentTrophies', 'targetTrophies'].includes(name)) {
      setTimeout(calculatePrice, 500)
    }
  }

  if (showSuccess) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            見積もり依頼を受付けました！
          </h3>
          <p className="text-gray-600 mb-6">
            担当者が内容を確認後、24時間以内にご連絡いたします。
          </p>
          <p className="text-sm text-gray-500">ダッシュボードに移動中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          Brawl Stars 代行依頼
        </h3>
        <p className="text-purple-100">
          詳細情報を入力して、見積もりを取得または即座に決済してください
        </p>
      </div>

      <form className="p-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              サービスタイプ *
            </label>
            <select
              name="serviceType"
              required
              value={formData.serviceType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">選択してください</option>
              <option value="trophy-push">トロフィー上げ</option>
              <option value="rank-push">ランク上げ</option>
              <option value="championship">チャンピオンシップ</option>
              <option value="daily-quest">デイリークエスト</option>
              <option value="event-clear">イベントクリア</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              現在のトロフィー数 *
            </label>
            <input
              type="number"
              name="currentTrophies"
              required
              value={formData.currentTrophies}
              onChange={handleInputChange}
              placeholder="例: 15000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目標トロフィー数 *
            </label>
            <input
              type="number"
              name="targetTrophies"
              required
              value={formData.targetTrophies}
              onChange={handleInputChange}
              placeholder="例: 20000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              デバイスタイプ *
            </label>
            <select
              name="deviceType"
              required
              value={formData.deviceType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="pc">PC (エミュレーター)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ゲームアカウント *
            </label>
            <input
              type="text"
              name="gameAccount"
              required
              value={formData.gameAccount}
              onChange={handleInputChange}
              placeholder="Supercell ID または プレイヤータグ"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード *
            </label>
            <input
              type="password"
              name="gamePassword"
              required
              value={formData.gamePassword}
              onChange={handleInputChange}
              placeholder="アカウントパスワード"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            希望作業時間
          </label>
          <input
            type="text"
            name="preferredTime"
            value={formData.preferredTime}
            onChange={handleInputChange}
            placeholder="例: 平日夜間、土日午後など"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            連絡方法
          </label>
          <select
            name="contactMethod"
            value={formData.contactMethod}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="in-app">アプリ内チャット</option>
            <option value="email">メール</option>
            <option value="discord">Discord</option>
            <option value="line">LINE</option>
          </select>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            追加要望・注意事項
          </label>
          <textarea
            name="additionalInfo"
            rows={4}
            value={formData.additionalInfo}
            onChange={handleInputChange}
            placeholder="特別な要望や注意事項があればご記入ください..."
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {formData.additionalInfo.length}/500文字
          </div>
        </div>

        {/* 料金表示 */}
        {estimatedPrice && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-2">見積もり結果</h4>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">推定料金:</span>
              <span className="text-2xl font-bold text-green-600">
                ¥{estimatedPrice.toLocaleString()}
              </span>
            </div>
            {estimatedDuration && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700">推定作業時間:</span>
                <span className="font-semibold text-blue-600">
                  {estimatedDuration}
                </span>
              </div>
            )}
          </div>
        )}

        {priceError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {priceError}
          </div>
        )}

        {/* 送信ボタン */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'quote')}
            disabled={isSubmitting}
            className="flex-1 bg-gray-600 text-white py-4 px-6 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center whitespace-nowrap"
          >
            {isSubmitting ? '送信中...' : '見積もり依頼'}
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'payment')}
            disabled={isSubmitting || !estimatedPrice}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center whitespace-nowrap"
          >
            {isSubmitting ? '処理中...' : '即座に決済'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">ご注意事項</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>アカウント情報は暗号化して安全に保管されます</li>
                <li>作業中はアカウントにログインしないでください</li>
                <li>作業完了後、パスワード変更を推奨します</li>
                <li>見積もり依頼は無料です（24時間以内に回答）</li>
                <li>即座決済の場合、作業は確認後すぐに開始されます</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
