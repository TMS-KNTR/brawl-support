import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { invokeEdgeFunction, supabase } from '../../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { BRAWLERS, STRENGTH_LABELS, STRENGTH_COLORS } from '../../../data/brawlers'
import type { BrawlerStrength } from '../../../data/brawlers'
import { calcTrophyPrice } from '../../../lib/pricing'

export default function BrawlStarsOrderForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    serviceType: '',
    currentTrophies: '',
    targetTrophies: '',
    gameAccount: '',
    gamePassword: '', // collected for payment path only; never stored in DB
    deviceType: 'android',
    additionalInfo: '',
    preferredTime: '',
    contactMethod: 'in-app',
  })
  const priceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [estimatedDuration, setEstimatedDuration] = useState<string>('')
  const [priceError, setPriceError] = useState<string | null>(null)
  const [feeRate, setFeeRate] = useState(0.20)

  // トロフィー上げ用
  const [selectedBrawlerId, setSelectedBrawlerId] = useState('')
  const [brawlerSearch, setBrawlerSearch] = useState('')

  const isTrophyPush = formData.serviceType === 'trophy-push'

  const selectedBrawler = useMemo(
    () => BRAWLERS.find((b) => b.id === selectedBrawlerId),
    [selectedBrawlerId]
  )

  const filteredBrawlers = useMemo(() => {
    if (!brawlerSearch) return BRAWLERS
    const q = brawlerSearch.toLowerCase()
    return BRAWLERS.filter((b) => b.name.toLowerCase().includes(q) || b.id.includes(q))
  }, [brawlerSearch])

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'platform_fee_rate')
      .single()
      .then(({ data }) => {
        if (data?.value != null) setFeeRate(Number(data.value))
      })
  }, [])

  // トロフィー上げの料金をローカル計算
  const trophyPriceResult = useMemo(() => {
    if (!isTrophyPush || !selectedBrawler) return null
    const cur = parseInt(formData.currentTrophies)
    const tgt = parseInt(formData.targetTrophies)
    if (isNaN(cur) || isNaN(tgt) || tgt <= cur) return null
    if (cur < 0 || tgt > 2000) return null
    return calcTrophyPrice(cur, tgt, selectedBrawler.strength)
  }, [isTrophyPush, selectedBrawler, formData.currentTrophies, formData.targetTrophies])

  // トロフィー上げの場合はローカル計算結果を反映
  useEffect(() => {
    if (isTrophyPush && trophyPriceResult) {
      setEstimatedPrice(trophyPriceResult.total)
      setPriceError(null)
    } else if (isTrophyPush) {
      setEstimatedPrice(null)
    }
  }, [trophyPriceResult, isTrophyPush])

  /** 料金計算（非トロフィー上げ：Edge Function呼び出し） */
  const calculatePrice = async () => {
    if (!formData.serviceType || !formData.currentTrophies || !formData.targetTrophies) {
      return
    }
    if (isTrophyPush) return // トロフィー上げはローカル計算

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
      setPriceError('料金計算に失敗しました')
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

    if (isTrophyPush && !selectedBrawlerId) {
      alert('キャラを選択してください')
      return
    }

    setIsSubmitting(true)

    const brawlerNote = selectedBrawler
      ? `キャラ: ${selectedBrawler.name}（${STRENGTH_LABELS[selectedBrawler.strength]}）`
      : ''

    try {
      if (submitType === 'payment') {
        const result = await invokeEdgeFunction('create-order-payment', {
          currentRank: formData.currentTrophies,
          targetRank: formData.targetTrophies,
          serviceType: formData.serviceType,
          region: formData.deviceType,
          notes: [
            formData.serviceType,
            brawlerNote,
            formData.additionalInfo,
            `希望時間: ${formData.preferredTime}`,
            `連絡方法: ${formData.contactMethod}`,
          ]
            .filter(Boolean)
            .join(' - '),
          totalPrice: estimatedPrice || 0,
        })

        if (result.success && result.data?.checkoutUrl) {
          const checkoutUrl = result.data.checkoutUrl
          if (!checkoutUrl.startsWith('https://checkout.stripe.com') && !checkoutUrl.startsWith(window.location.origin)) {
            throw new Error('不正なリダイレクト先です')
          }
          window.location.href = checkoutUrl
        } else {
          throw new Error(result.error || '注文の作成に失敗しました')
        }
      } else {
        // 見積もり依頼: 注文は作成せず、問い合わせとして受け付ける
        setShowSuccess(true)
        setTimeout(() => navigate('/dashboard/customer'), 2000)
      }
    } catch (error: any) {
      console.error('送信エラー:', error)
      alert('送信に失敗しました。再度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // サービスタイプ変更時にリセット
    if (name === 'serviceType') {
      setEstimatedPrice(null)
      setEstimatedDuration('')
      setPriceError(null)
      if (value !== 'trophy-push') {
        setSelectedBrawlerId('')
        setBrawlerSearch('')
      }
    }

    if (['serviceType', 'currentTrophies', 'targetTrophies'].includes(name)) {
      if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
      priceTimerRef.current = setTimeout(calculatePrice, 500);
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
        </div>

        {/* ═══ トロフィー上げ：キャラ選択 ═══ */}
        {isTrophyPush && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              キャラクター選択 *
            </label>

            {/* 選択済み表示 */}
            {selectedBrawler && (
              <div className="flex items-center gap-3 p-3 mb-3 rounded-lg border-2 border-purple-300 bg-purple-50">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[15px] font-bold text-gray-900">{selectedBrawler.name}</span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
                    style={{
                      color: STRENGTH_COLORS[selectedBrawler.strength],
                      background: STRENGTH_COLORS[selectedBrawler.strength] + '15',
                    }}
                  >
                    {STRENGTH_LABELS[selectedBrawler.strength]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedBrawlerId(''); setBrawlerSearch('') }}
                  className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  変更
                </button>
              </div>
            )}

            {/* キャラ検索・一覧 */}
            {!selectedBrawler && (
              <>
                <input
                  type="text"
                  value={brawlerSearch}
                  onChange={(e) => setBrawlerSearch(e.target.value)}
                  placeholder="キャラ名で検索..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
                />
                <div className="max-h-[280px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {filteredBrawlers.map((brawler) => (
                    <button
                      key={brawler.id}
                      type="button"
                      onClick={() => { setSelectedBrawlerId(brawler.id); setBrawlerSearch('') }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 transition-colors text-left cursor-pointer"
                    >
                      <span className="text-[13px] font-semibold text-gray-900 flex-1">{brawler.name}</span>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          color: STRENGTH_COLORS[brawler.strength],
                          background: STRENGTH_COLORS[brawler.strength] + '15',
                        }}
                      >
                        {STRENGTH_LABELS[brawler.strength]}
                      </span>
                    </button>
                  ))}
                  {filteredBrawlers.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      該当するキャラが見つかりません
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ トロフィー数入力 ═══ */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isTrophyPush ? '現在のトロフィー数（キャラ個別）*' : '現在のトロフィー数 *'}
            </label>
            <input
              type="number"
              name="currentTrophies"
              required
              value={formData.currentTrophies}
              onChange={handleInputChange}
              placeholder={isTrophyPush ? '例: 500' : '例: 15000'}
              min={0}
              max={isTrophyPush ? 2000 : undefined}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isTrophyPush ? '目標トロフィー数（キャラ個別）*' : '目標トロフィー数 *'}
            </label>
            <input
              type="number"
              name="targetTrophies"
              required
              value={formData.targetTrophies}
              onChange={handleInputChange}
              placeholder={isTrophyPush ? '例: 1500' : '例: 20000'}
              min={0}
              max={isTrophyPush ? 2000 : undefined}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ═══ トロフィー上げ：料金プレビュー ═══ */}
        {isTrophyPush && trophyPriceResult && trophyPriceResult.total > 0 && (
          <div className="mt-6 p-5 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
            <h4 className="font-semibold text-gray-900 mb-3">料金</h4>

            {selectedBrawler && (
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                <span>{selectedBrawler.name}</span>
                <span className="text-gray-300">|</span>
                <span style={{ color: STRENGTH_COLORS[selectedBrawler.strength] }}>
                  {STRENGTH_LABELS[selectedBrawler.strength]}
                </span>
                <span className="text-gray-300">|</span>
                <span>{formData.currentTrophies} → {formData.targetTrophies} トロフィー</span>
              </div>
            )}

            {/* 内訳 */}
            {trophyPriceResult.breakdown.length > 1 && (
              <div className="space-y-1.5 mb-3">
                {trophyPriceResult.breakdown.map((seg, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{seg.label} 帯</span>
                    <span className="font-medium text-gray-800">¥{seg.price.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-green-200 pt-1.5" />
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">合計料金</span>
              <span className="text-2xl font-bold text-green-600">
                ¥{trophyPriceResult.total.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* ═══ トロフィー上げ：料金表 ═══ */}
        {isTrophyPush && !trophyPriceResult && (
          <div className="mt-6 p-5 rounded-lg border border-gray-200 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-3">料金表</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 text-gray-600">トロフィー帯</th>
                  <th className="text-right py-2 text-green-600">強い</th>
                  <th className="text-right py-2 text-blue-600">普通</th>
                  <th className="text-right py-2 text-red-600">弱い</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-700">0 〜 1,000</td>
                  <td className="py-2 text-right text-gray-900 font-medium" colSpan={3}>¥3,000（一律）</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">1,000 〜 2,000</td>
                  <td className="py-2 text-right text-green-700 font-medium">¥4,500</td>
                  <td className="py-2 text-right text-blue-700 font-medium">¥5,000</td>
                  <td className="py-2 text-right text-red-700 font-medium">¥5,500</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-2">* 帯をまたぐ場合は按分で合算されます</p>
          </div>
        )}

        {/* 目標1000以上の注意書き */}
        {isTrophyPush && parseInt(formData.targetTrophies) >= 1000 && (
          <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
            <span className="text-xs text-amber-800">トロフィー1,000以上はハイパーチャージ・スタパ・ギア解放キャラのみ対応</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mt-6">
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

        {/* 料金表示（非トロフィー上げ） */}
        {!isTrophyPush && estimatedPrice && (
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
                <li>アカウント情報は注文受付後、チャットで安全にやり取りしてください</li>
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
