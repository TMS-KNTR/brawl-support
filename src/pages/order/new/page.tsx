import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { invokeEdgeFunction } from '../../../lib/supabase'
import { calcRankedPrice, calcTrophyPrice } from '../../../lib/pricing'
import Header from '../../home/components/Header'
import Footer from '../../home/components/Footer'

export default function OrderPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'rank' | 'trophy'>('rank')

  // ガチバトル上げ
  const [current, setCurrent] = useState(0)
  const [target, setTarget] = useState(3000)
  const [power11Count, setPower11Count] = useState(0)
  const [buffyCount, setBuffyCount] = useState(0)

  // トロフィー上げ
  const [currentTrophy, setCurrentTrophy] = useState(0)
  const [targetTrophy, setTargetTrophy] = useState(500)
  const [characterType, setCharacterType] = useState<'strong' | 'normal' | 'weak'>('normal')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** 料金計算（リアルタイム） */
  const priceResult = useMemo(() => {
    if (mode === 'rank') {
      return calcRankedPrice(current, target, power11Count, buffyCount)
    }
    return null
  }, [mode, current, target, power11Count, buffyCount])

  const trophyPrice = useMemo(() => {
    if (mode === 'trophy') {
      return calcTrophyPrice(currentTrophy, targetTrophy, characterType)
    }
    return 0
  }, [mode, currentTrophy, targetTrophy, characterType])

  const totalPrice = mode === 'rank' ? (priceResult?.total ?? 0) : trophyPrice

  /** Stripe Checkout で決済 */
  const handlePayment = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (totalPrice <= 0) {
      setError('目標値は現在値より大きく設定してください')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await invokeEdgeFunction('create-order-payment', {
        currentRank: mode === 'rank' ? String(current) : String(currentTrophy),
        targetRank: mode === 'rank' ? String(target) : String(targetTrophy),
        region: mode,
        notes: mode === 'rank'
          ? `ガチバトル代行: パワー11×${power11Count}体, バフィー×${buffyCount}体`
          : `トロ上げ代行: ${characterType === 'strong' ? '強' : characterType === 'weak' ? '弱' : '中'}キャラ`,
        credentials: { username: '', password: '', notes: '' },
        totalPrice,
      })

      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
      } else {
        throw new Error(result.error || '注文の作成に失敗しました')
      }
    } catch (err: any) {
      console.error('決済エラー:', err)
      setError(err.message || '決済処理に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">依頼注文フォーム</h1>

        {/* モード選択 */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setMode('rank')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              mode === 'rank'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ガチバトル代行
          </button>
          <button
            onClick={() => setMode('trophy')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              mode === 'trophy'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            トロ上げ
          </button>
        </div>

        {/* ======== ガチバトル上げ ======== */}
        {mode === 'rank' && (
          <div className="space-y-6">
            {/* 現在値スライダー */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">現在のランクポイント</label>
                <span className="text-lg font-bold text-purple-600">{current.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={0}
                max={11250}
                step={50}
                value={current}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setCurrent(val)
                  if (val >= target) setTarget(Math.min(val + 250, 11250))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>3000</span>
                <span>6000</span>
                <span>9000</span>
                <span>11250</span>
              </div>
            </div>

            {/* 目標値スライダー */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">目標のランクポイント</label>
                <span className="text-lg font-bold text-green-600">{target.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={0}
                max={11250}
                step={50}
                value={target}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setTarget(val)
                  if (val <= current) setCurrent(Math.max(val - 250, 0))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>3000</span>
                <span>6000</span>
                <span>9000</span>
                <span>11250</span>
              </div>
            </div>

            {/* パワー11キャラ数 */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  パワー11キャラ数
                  <span className="text-xs text-gray-400 ml-1">（多いほど割引）</span>
                </label>
                <span className="font-bold">{power11Count} / 98体</span>
              </div>
              <input
                type="range"
                min={0}
                max={98}
                step={1}
                value={power11Count}
                onChange={(e) => setPower11Count(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* バフィー数 */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  バフィー数
                  <span className="text-xs text-gray-400 ml-1">（多いほど割引）</span>
                </label>
                <span className="font-bold">{buffyCount} / 36個</span>
              </div>
              <input
                type="range"
                min={0}
                max={36}
                step={1}
                value={buffyCount}
                onChange={(e) => setBuffyCount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* 料金内訳 */}
            {priceResult && priceResult.breakdown.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">料金内訳</h3>
                <div className="space-y-2">
                  {priceResult.breakdown.map((seg, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {seg.from.toLocaleString()} → {seg.to.toLocaleString()} pt
                      </span>
                      <span className="font-medium">¥{seg.price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-bold">合計</span>
                    <span className="font-bold text-lg text-green-600">
                      ¥{priceResult.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======== トロフィー上げ ======== */}
        {mode === 'trophy' && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">現在のトロフィー</label>
                <span className="text-lg font-bold text-purple-600">{currentTrophy.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2000}
                step={10}
                value={currentTrophy}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setCurrentTrophy(val)
                  if (val >= targetTrophy) setTargetTrophy(Math.min(val + 50, 2000))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">目標のトロフィー</label>
                <span className="text-lg font-bold text-green-600">{targetTrophy.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2000}
                step={10}
                value={targetTrophy}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setTargetTrophy(val)
                  if (val <= currentTrophy) setCurrentTrophy(Math.max(val - 50, 0))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">キャラの強さ</label>
              <div className="flex gap-2">
                {(['strong', 'normal', 'weak'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setCharacterType(s)}
                    className={`flex-1 py-3 rounded-lg font-bold transition ${
                      characterType === s
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {s === 'strong' ? '強キャラ' : s === 'weak' ? '弱キャラ' : '中キャラ'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                強キャラは安く、弱キャラは高くなります
              </p>
            </div>
          </div>
        )}

        {/* ======== 料金表示 & 決済ボタン ======== */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-lg">料金</span>
            <span className="text-3xl font-bold text-green-600">
              ¥{totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isSubmitting || totalPrice <= 0}
          className="mt-6 w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? '処理中...' : '決済へ進む'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          テスト環境です。実際の課金は発生しません。
        </p>
      </div>

      <Footer />
    </div>
  )
}
