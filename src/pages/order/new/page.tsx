import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { invokeEdgeFunction, supabase } from '../../../lib/supabase'
import { calcRankedPrice, calcTrophyPrice } from '../../../lib/pricing'
import { BRAWLERS, STRENGTH_LABELS, STRENGTH_COLORS } from '../../../data/brawlers'
import Header from '../../home/components/Header'
import Footer from '../../home/components/Footer'

/* ── ランク帯定義 ── */
const RANK_TIERS = [
  { name: 'ブロンズ',    from: 0,     to: 750,   color: '#CD7F32' },
  { name: 'シルバー',    from: 750,   to: 1500,  color: '#A8A8A8' },
  { name: 'ゴールド',    from: 1500,  to: 3000,  color: '#FFD700' },
  { name: 'ダイヤモンド', from: 3000,  to: 4500,  color: '#60A5FA' },
  { name: 'エリート',    from: 4500,  to: 6000,  color: '#A855F7' },
  { name: 'レジェンド',   from: 6000,  to: 8250,  color: '#EF4444' },
  { name: 'マスター',    from: 8250,  to: 99999, color: '#FBBF24' },
]

function getTierName(pt: number) {
  return RANK_TIERS.find(t => pt >= t.from && pt < t.to)?.name ?? 'マスター'
}

function getTierColor(pt: number) {
  return RANK_TIERS.find(t => pt >= t.from && pt < t.to)?.color ?? '#FBBF24'
}

/* ── クリックで編集できる数値表示 ── */
function EditableValue({
  value, onChange, min, max, step, color, suffix = '',
}: {
  value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; color: string; suffix?: string;
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commit = () => {
    setEditing(false)
    const n = Math.round(Number(draft) / step) * step
    if (!isNaN(n)) onChange(Math.min(Math.max(n, min), max))
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
        className="w-24 text-right text-xl font-extrabold outline-none border-b-2 bg-transparent"
        style={{ color, borderColor: color }}
        min={min}
        max={max}
        step={step}
      />
    )
  }

  return (
    <button
      onClick={startEdit}
      className="text-xl font-extrabold cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1"
      style={{ color }}
      title="クリックして直接入力"
    >
      {value.toLocaleString()}{suffix}
      <i className="ri-edit-line text-xs opacity-40"></i>
    </button>
  )
}

/* ── ランク帯バー一体型デュアルスライダー ── */
function RankTierSlider({
  current, target, onChange,
}: {
  current: number; target: number;
  onChange: (current: number, target: number) => void;
}) {
  const MAX = 10250
  const STEP = 1
  const barRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'current' | 'target' | null>(null)

  const snap = (v: number) => Math.round(Math.min(Math.max(v, 0), MAX) / STEP) * STEP

  const getValueFromPointer = useCallback((clientX: number) => {
    const bar = barRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    return snap(ratio * MAX)
  }, [])

  const handlePointerDown = (which: 'current' | 'target') => (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragging.current = which
  }

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const val = getValueFromPointer(e.clientX)
    if (dragging.current === 'current') {
      const c = Math.min(val, target)
      onChange(c, target)
    } else {
      const t = Math.max(val, current)
      onChange(current, t)
    }
  }, [current, target, onChange, getValueFromPointer])

  const handlePointerUp = useCallback(() => { dragging.current = null }, [])

  const currentPct = (current / MAX) * 100
  const targetPct = (target / MAX) * 100

  return (
    <div>
      {/* バー */}
      <div
        ref={barRef}
        className="relative select-none"
        style={{ touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* シンプルなバー: 灰色ベース + 現在〜目標が紫グラデーション */}
        <div className="relative h-3 rounded-full bg-[#E8E4F3] overflow-hidden">
          {targetPct > currentPct && (
            <div
              className="absolute top-0 h-full rounded-full"
              style={{
                left: `${currentPct}%`,
                width: `${targetPct - currentPct}%`,
                background: 'linear-gradient(90deg, #5B3AE8, #8B7AFF, #10B981)',
              }}
            />
          )}
        </div>

        {/* 現在ツマミ */}
        <div
          className="absolute top-1/2 cursor-grab active:cursor-grabbing z-20"
          style={{ left: `${currentPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
          onPointerDown={handlePointerDown('current')}
        >
          <div className="w-5 h-5 rounded-full bg-white border-[3px] border-[#5B3AE8] shadow-md shadow-[#5B3AE8]/25" />
        </div>

        {/* 目標ツマミ */}
        <div
          className="absolute top-1/2 cursor-grab active:cursor-grabbing z-20"
          style={{ left: `${targetPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
          onPointerDown={handlePointerDown('target')}
        >
          <div className="w-5 h-5 rounded-full bg-white border-[3px] border-[#10B981] shadow-md shadow-[#10B981]/25" />
        </div>
      </div>

      {/* 目盛り */}
      <div className="relative mt-1.5 h-4">
        {[0, 3000, 4500, 6000, 8250, 10250].map((v) => (
          <span
            key={v}
            className="absolute text-[9px] text-[#9890B8] font-medium select-none"
            style={{ left: `${(v / MAX) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {v.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── 汎用デュアルスライダー ── */
function DualSlider({
  current, target, max, onChange, ticks,
}: {
  current: number; target: number; max: number;
  onChange: (current: number, target: number) => void;
  ticks: number[];
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'current' | 'target' | null>(null)

  const getValueFromPointer = useCallback((clientX: number) => {
    const bar = barRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    return Math.round(ratio * max)
  }, [max])

  const handlePointerDown = (which: 'current' | 'target') => (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragging.current = which
  }

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const val = getValueFromPointer(e.clientX)
    if (dragging.current === 'current') {
      onChange(Math.min(val, target), target)
    } else {
      onChange(current, Math.max(val, current))
    }
  }, [current, target, onChange, getValueFromPointer])

  const handlePointerUp = useCallback(() => { dragging.current = null }, [])

  const currentPct = (current / max) * 100
  const targetPct = (target / max) * 100

  return (
    <div>
      <div
        ref={barRef}
        className="relative select-none"
        style={{ touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="relative h-3 rounded-full bg-[#E8E4F3] overflow-hidden">
          {targetPct > currentPct && (
            <div
              className="absolute top-0 h-full rounded-full"
              style={{
                left: `${currentPct}%`,
                width: `${targetPct - currentPct}%`,
                background: 'linear-gradient(90deg, #5B3AE8, #8B7AFF, #10B981)',
              }}
            />
          )}
        </div>

        {/* 現在ツマミ */}
        <div
          className="absolute top-1/2 cursor-grab active:cursor-grabbing z-20"
          style={{ left: `${currentPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
          onPointerDown={handlePointerDown('current')}
        >
          <div className="w-5 h-5 rounded-full bg-white border-[3px] border-[#5B3AE8] shadow-md shadow-[#5B3AE8]/25" />
        </div>

        {/* 目標ツマミ */}
        <div
          className="absolute top-1/2 cursor-grab active:cursor-grabbing z-20"
          style={{ left: `${targetPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
          onPointerDown={handlePointerDown('target')}
        >
          <div className="w-5 h-5 rounded-full bg-white border-[3px] border-[#10B981] shadow-md shadow-[#10B981]/25" />
        </div>
      </div>

      {/* 目盛り */}
      <div className="relative mt-1.5 h-4">
        {ticks.map((v) => (
          <span
            key={v}
            className="absolute text-[9px] text-[#9890B8] font-medium select-none"
            style={{ left: `${(v / max) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {v.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function OrderPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [maintenance, setMaintenance] = useState(false)

  useEffect(() => {
    supabase.from('system_settings').select('value').eq('key', 'maintenance_mode').single()
      .then(({ data }) => { if (data?.value === 'true') setMaintenance(true) })
  }, [])

  const [mode, setMode] = useState<'rank' | 'trophy'>('rank')

  // ガチバトル上げ
  const [current, setCurrent] = useState(0)
  const [target, setTarget] = useState(3000)
  const [power11Count, setPower11Count] = useState(0)
  const [buffyCount, setBuffyCount] = useState(0)

  // トロフィー上げ
  const [currentTrophy, setCurrentTrophy] = useState(0)
  const [targetTrophy, setTargetTrophy] = useState(500)
  const [selectedBrawlerId, setSelectedBrawlerId] = useState('')
  const [brawlerSearch, setBrawlerSearch] = useState('')

  const selectedBrawler = useMemo(
    () => BRAWLERS.find((b) => b.id === selectedBrawlerId),
    [selectedBrawlerId]
  )

  const filteredBrawlers = useMemo(() => {
    if (!brawlerSearch) return BRAWLERS
    const q = brawlerSearch.toLowerCase()
    return BRAWLERS.filter((b) => b.name.toLowerCase().includes(q) || b.id.includes(q))
  }, [brawlerSearch])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** 料金計算（リアルタイム） */
  const priceResult = useMemo(() => {
    if (mode === 'rank') {
      return calcRankedPrice(current, target, power11Count, buffyCount)
    }
    return null
  }, [mode, current, target, power11Count, buffyCount])

  const trophyPriceResult = useMemo(() => {
    if (mode === 'trophy' && selectedBrawler) {
      return calcTrophyPrice(currentTrophy, targetTrophy, selectedBrawler.strength)
    }
    return null
  }, [mode, currentTrophy, targetTrophy, selectedBrawler])

  const totalPrice = mode === 'rank' ? (priceResult?.total ?? 0) : (trophyPriceResult?.total ?? 0)

  /** UnivaPay ウィジェットで決済 */
  const handlePayment = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (totalPrice <= 0) {
      setError('目標値は現在値より大きく設定してください')
      return
    }

    if (maintenance) {
      setError('現在メンテナンス中のため、新規注文を受け付けていません。')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 1. サーバー側で料金検証＋仮注文作成
      const result = await invokeEdgeFunction('create-order-payment', {
        currentRank: mode === 'rank' ? String(current) : String(currentTrophy),
        targetRank: mode === 'rank' ? String(target) : String(targetTrophy),
        serviceType: mode === 'rank' ? 'rank' : 'trophy',
        notes: mode === 'rank'
          ? `ガチバトル上げ: ハイチャ解放×${power11Count}体, バフィー3つ解放×${buffyCount}体`
          : `トロフィー上げ: キャラ: ${selectedBrawler?.name ?? '未選択'}（${selectedBrawler ? STRENGTH_LABELS[selectedBrawler.strength] : ''}）`,
        totalPrice,
        // サーバー側料金検証用パラメータ
        power11Count: mode === 'rank' ? power11Count : undefined,
        buffyCount: mode === 'rank' ? buffyCount : undefined,
        brawlerStrength: mode === 'trophy' ? selectedBrawler?.strength : undefined,
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || '注文の作成に失敗しました')
      }

      const { orderId, amount, currency, appId, metadata } = result.data

      // 2. UnivaPay ウィジェットを開く
      if (typeof (window as any).UnivapayCheckout === 'undefined') {
        throw new Error('決済システムの読み込みに失敗しました。ページを再読み込みしてください。')
      }

      const checkout = (window as any).UnivapayCheckout.create({
        appId,
        checkout: 'payment',
        amount,
        currency,
        metadata,
        onSuccess: () => {
          navigate(`/payment-success?order_id=${orderId}`)
        },
        onError: () => {
          setError('決済に失敗しました。もう一度お試しください。')
          setIsSubmitting(false)
        },
        onClose: () => {
          setIsSubmitting(false)
        },
      })

      checkout.open()
    } catch (err: any) {
      console.error('決済エラー:', err)
      setError(err.message || '決済処理に失敗しました。もう一度お試しください。')
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-white text-[#1E293B] overflow-x-hidden"
      style={{ fontFamily: '"Rajdhani", sans-serif' }}
    >
      <Helmet>
        <title>依頼注文 | げむ助 - ブロスタ代行サービス</title>
        <meta name="description" content="ブロスタのランク上げ・トロフィー上げの依頼注文ページ。条件を入力するだけで料金が自動計算。安全な決済でそのまま依頼できます。" />
        <meta property="og:title" content="依頼注文 | げむ助" />
        <meta property="og:description" content="ブロスタの代行依頼をかんたん注文。料金自動計算で安心。" />
        <meta property="og:image" content="https://gemusuke.com/og-image.png" />
        <link rel="canonical" href="https://gemusuke.com/order/new" />
      </Helmet>
      <Header />

      <style>{`
        @keyframes order-fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes order-headerIn {
          from { opacity: 0; transform: translateY(18px) rotateX(35deg); }
          to   { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }
        @keyframes order-glow {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.7; }
        }
        @keyframes order-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes order-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.03); }
        }
        .order-tab {
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .order-tab::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg, transparent 35%,
            rgba(255,255,255,0.15) 45%,
            rgba(255,255,255,0.25) 50%,
            rgba(255,255,255,0.15) 55%,
            transparent 65%
          );
          background-size: 200% 100%;
          background-position: -200% center;
        }
        .order-tab:hover::after {
          animation: order-shimmer 0.8s ease forwards;
        }
        .order-tab-active {
          box-shadow: 0 8px 24px rgba(91,58,232,0.3), 0 0 12px rgba(91,58,232,0.1);
        }
        .order-tab-active:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(91,58,232,0.4), 0 0 16px rgba(91,58,232,0.15);
        }
        .order-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
          transition: opacity 0.2s;
          touch-action: none;
        }
        .order-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #5B3AE8;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(91,58,232,0.4), 0 0 0 1px rgba(91,58,232,0.1);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .order-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(91,58,232,0.5), 0 0 0 2px rgba(91,58,232,0.15);
        }
        .order-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #5B3AE8;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(91,58,232,0.4);
          cursor: pointer;
        }
        .order-slider-green::-webkit-slider-thumb {
          background: #10B981;
          box-shadow: 0 2px 8px rgba(16,185,129,0.4), 0 0 0 1px rgba(16,185,129,0.1);
        }
        .order-slider-green::-webkit-slider-thumb:hover {
          box-shadow: 0 4px 16px rgba(16,185,129,0.5), 0 0 0 2px rgba(16,185,129,0.15);
        }
        .order-slider-green::-moz-range-thumb {
          background: #10B981;
          box-shadow: 0 2px 8px rgba(16,185,129,0.4);
        }
        .order-card {
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease;
        }
        .order-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(91,58,232,0.08), 0 0 0 1px rgba(91,58,232,0.06);
        }
        .order-pay-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 4px 16px rgba(16,185,129,0.3);
        }
        .order-pay-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg, transparent 35%,
            rgba(255,255,255,0.18) 45%,
            rgba(255,255,255,0.3) 50%,
            rgba(255,255,255,0.18) 55%,
            transparent 65%
          );
          background-size: 200% 100%;
          background-position: -200% center;
        }
        .order-pay-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(16,185,129,0.45), 0 0 24px rgba(16,185,129,0.2);
        }
        .order-pay-btn:hover::before {
          animation: order-shimmer 0.8s ease forwards;
        }
        .order-pay-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        .order-pay-btn:disabled::before {
          display: none;
        }
        .order-brawler-item {
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .order-brawler-item:hover {
          background: #F8F6FF;
          padding-left: 20px;
        }
      `}</style>

      {/* ===== Form Section ===== */}
      <section className="pt-[72px] bg-white overflow-hidden">
        <div className="pt-10 pb-10">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">

          {/* モード選択タブ */}
          <div className="flex gap-3 mb-10">
            <button
              onClick={() => setMode('rank')}
              className={`order-tab relative flex-1 py-5 rounded-xl font-bold text-[13px] tracking-wider uppercase cursor-pointer overflow-hidden ${
                mode === 'rank'
                  ? 'order-tab-active text-white'
                  : 'bg-[#F8F6FF] text-[#7C6F99] hover:bg-[#EDE9FE] hover:text-[#5B3AE8]'
              }`}
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              {mode === 'rank' && (
                <>
                  <img src="/ranked.webp" alt="ブロスタ ガチバトル" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#5B3AE8]/75" />
                </>
              )}
              <span className="relative z-10">
                <i className="ri-sword-line mr-2"></i>
                ガチバトル上げ
              </span>
            </button>
            <button
              onClick={() => setMode('trophy')}
              className={`order-tab relative flex-1 py-5 rounded-xl font-bold text-[13px] tracking-wider uppercase cursor-pointer overflow-hidden ${
                mode === 'trophy'
                  ? 'order-tab-active text-white'
                  : 'bg-[#F8F6FF] text-[#7C6F99] hover:bg-[#EDE9FE] hover:text-[#5B3AE8]'
              }`}
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              {mode === 'trophy' && (
                <>
                  <img src="/trophy.webp" alt="ブロスタ トロフィー" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#5B3AE8]/75" />
                </>
              )}
              <span className="relative z-10">
                <i className="ri-trophy-line mr-2"></i>
                トロフィー上げ
              </span>
            </button>
          </div>

          {/* ======== ガチバトル上げ ======== */}
          {mode === 'rank' && (
            <div className="space-y-6">
              {/* ランク帯スライダー */}
              <div className="order-card rounded-xl border border-[#E8E4F3] p-6">
                {/* 値表示: 現在 → 目標 */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[10px] font-bold text-[#7C6F99] tracking-wide block mb-1">現在</span>
                    <div className="flex items-center gap-2">
                      <EditableValue
                        value={current} min={0} max={10250} step={1} color="#5B3AE8"
                        onChange={(v) => { const c = Math.min(v, target); setCurrent(c) }}
                      />
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: getTierColor(current), background: getTierColor(current) + '18' }}
                      >
                        {getTierName(current)}
                      </span>
                    </div>
                  </div>
                  <i className="ri-arrow-right-line text-[#E8E4F3] text-xl mt-4"></i>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#7C6F99] tracking-wide block mb-1">目標</span>
                    <div className="flex items-center gap-2 justify-end">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: getTierColor(target), background: getTierColor(target) + '18' }}
                      >
                        {getTierName(target)}
                      </span>
                      <EditableValue
                        value={target} min={0} max={10250} step={1} color="#10B981"
                        onChange={(v) => { const t = Math.max(v, current); setTarget(t) }}
                      />
                    </div>
                  </div>
                </div>

                {/* ランク帯バー＝スライダー */}
                <RankTierSlider
                  current={current}
                  target={target}
                  onChange={(c, t) => { setCurrent(c); setTarget(t) }}
                />
              </div>

              {/* キャラ解放数 */}
              <div className="order-card rounded-xl border border-[#E8E4F3] bg-[#FAFAFF] p-6 space-y-5">
                {/* ハイパーチャージ解放キャラ */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <i className="ri-flashlight-line text-sm text-[#5B3AE8]"></i>
                      <label className="text-[13px] font-bold text-[#1A1A2E] tracking-wide">ハイパーチャージ解放キャラ</label>
                    </div>
                    <span className="text-[14px] font-extrabold text-[#5B3AE8]">{power11Count} / 100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={power11Count}
                    onChange={(e) => setPower11Count(Number(e.target.value))}
                    className="order-slider w-full"
                    style={{ background: `linear-gradient(to right, #5B3AE8 ${power11Count}%, #E8E4F3 ${power11Count}%)` }}
                  />
                </div>

                <div className="border-t border-[#E8E4F3]"></div>

                {/* バフィー3つ解放キャラ */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <i className="ri-star-smile-line text-sm text-[#5B3AE8]"></i>
                      <label className="text-[13px] font-bold text-[#1A1A2E] tracking-wide">バフィー3つ解放キャラ</label>
                    </div>
                    <span className="text-[14px] font-extrabold text-[#5B3AE8]">{buffyCount} / 12</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={buffyCount}
                    onChange={(e) => setBuffyCount(Number(e.target.value))}
                    className="order-slider w-full"
                    style={{ background: `linear-gradient(to right, #5B3AE8 ${(buffyCount / 12) * 100}%, #E8E4F3 ${(buffyCount / 12) * 100}%)` }}
                  />
                </div>
              </div>

              {/* 料金内訳 */}
              {priceResult && priceResult.breakdown.length > 0 && (
                <div className="order-card rounded-xl border border-[#E8E4F3] border-l-[3px] border-l-[#5B3AE8] p-6">
                  <h3 className="text-[14px] font-bold text-[#1A1A2E] tracking-wide mb-4">
                    料金内訳
                  </h3>
                  <div className="space-y-2.5">
                    {priceResult.breakdown.map((seg, i) => (
                      <div key={i} className="flex justify-between items-center text-[13px]">
                        <span className="text-[#7C6F99] font-medium">
                          {seg.from.toLocaleString()} → {seg.to.toLocaleString()} pt
                        </span>
                        <span className="font-bold text-[#1A1A2E]">
                          ¥{seg.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-[#E8E4F3] pt-3 mt-3 flex justify-between items-center">
                      <span className="font-bold text-[#1A1A2E] text-[14px]">合計</span>
                      <span className="font-extrabold text-xl text-[#1A1A2E]">
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
              {/* キャラ選択 */}
              <div className="order-card rounded-xl border border-[#E8E4F3] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#F3F0FF] flex items-center justify-center">
                    <i className="ri-user-star-line text-sm text-[#5B3AE8]"></i>
                  </div>
                  <label className="text-[13px] font-bold text-[#1A1A2E] tracking-wide">キャラクター選択</label>
                </div>

                {selectedBrawler ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F8F6FF] border-2 border-[#5B3AE8]/20">
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-[15px] font-bold text-[#1A1A2E]">{selectedBrawler.name}</span>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold"
                        style={{
                          color: STRENGTH_COLORS[selectedBrawler.strength],
                          background: STRENGTH_COLORS[selectedBrawler.strength] + '15',
                        }}
                      >
                        {STRENGTH_LABELS[selectedBrawler.strength]}
                      </span>
                    </div>
                    <button
                      onClick={() => { setSelectedBrawlerId(''); setBrawlerSearch('') }}
                      className="text-[11px] font-bold text-[#5B3AE8] hover:text-[#4F2FD8] cursor-pointer tracking-wider uppercase transition-colors"
                    >
                      変更
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-3">
                      <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-[#9890B8] text-sm"></i>
                      <input
                        type="text"
                        value={brawlerSearch}
                        onChange={(e) => setBrawlerSearch(e.target.value)}
                        placeholder="キャラ名で検索..."
                        className="w-full pl-10 pr-4 py-3 border border-[#E8E4F3] rounded-xl focus:ring-2 focus:ring-[#5B3AE8]/30 focus:border-[#5B3AE8] text-[13px] text-[#1A1A2E] placeholder-[#B8B0CC] font-medium transition-all outline-none"
                      />
                    </div>
                    <div className="max-h-[280px] overflow-y-auto border border-[#E8E4F3] rounded-xl divide-y divide-[#F3F0FF]">
                      {filteredBrawlers.map((brawler) => (
                        <button
                          key={brawler.id}
                          type="button"
                          onClick={() => { setSelectedBrawlerId(brawler.id); setBrawlerSearch('') }}
                          className="order-brawler-item w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
                        >
                          <span className="text-[13px] font-bold text-[#1A1A2E] flex-1">{brawler.name}</span>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold"
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
                        <div className="px-4 py-8 text-center text-[12px] text-[#9890B8] font-medium">
                          該当するキャラが見つかりません
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* トロフィースライダー */}
              <div className="order-card rounded-xl border border-[#E8E4F3] p-6">
                {/* 値表示: 現在 → 目標 */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[10px] font-bold text-[#7C6F99] tracking-wide block mb-1">現在</span>
                    <EditableValue
                      value={currentTrophy} min={0} max={3000} step={1} color="#5B3AE8"
                      onChange={(v) => { const c = Math.min(v, targetTrophy); setCurrentTrophy(c) }}
                    />
                  </div>
                  <i className="ri-arrow-right-line text-[#E8E4F3] text-xl mt-4"></i>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#7C6F99] tracking-wide block mb-1">目標</span>
                    <EditableValue
                      value={targetTrophy} min={0} max={3000} step={1} color="#10B981"
                      onChange={(v) => { const t = Math.max(v, currentTrophy); setTargetTrophy(t) }}
                    />
                  </div>
                </div>

                <DualSlider
                  current={currentTrophy}
                  target={targetTrophy}
                  max={3000}
                  onChange={(c, t) => { setCurrentTrophy(c); setTargetTrophy(t) }}
                  ticks={[0, 500, 1000, 1500, 2000, 2500, 3000]}
                />
              </div>

              {/* 料金内訳 */}
              {trophyPriceResult && trophyPriceResult.breakdown.length > 0 && (
                <div className="order-card rounded-xl border border-[#E8E4F3] border-l-[3px] border-l-[#5B3AE8] p-6">
                  <h3 className="text-[14px] font-bold text-[#1A1A2E] tracking-wide mb-4">
                    料金内訳
                  </h3>
                  <div className="space-y-2.5">
                    {selectedBrawler && (
                      <div className="flex items-center gap-2 text-[12px] text-[#7C6F99] mb-3 pb-3 border-b border-[#E8E4F3] font-medium">
                        <span>{selectedBrawler.name}</span>
                        <span style={{ color: STRENGTH_COLORS[selectedBrawler.strength] }}>
                          （{STRENGTH_LABELS[selectedBrawler.strength]}）
                        </span>
                      </div>
                    )}
                    {trophyPriceResult.breakdown.map((seg, i) => (
                      <div key={i} className="flex justify-between items-center text-[13px]">
                        <span className="text-[#7C6F99] font-medium">{seg.label} 帯</span>
                        <span className="font-bold text-[#1A1A2E]">¥{seg.price.toLocaleString()}</span>
                      </div>
                    ))}
                    {trophyPriceResult.breakdown.length > 1 && (
                      <div className="border-t border-[#E8E4F3] pt-3 mt-3 flex justify-between items-center">
                        <span className="font-bold text-[#1A1A2E] text-[14px]">合計</span>
                        <span className="font-extrabold text-xl text-[#1A1A2E]">
                          ¥{trophyPriceResult.total.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 目標1000以上の注意書き */}
              {targetTrophy >= 1000 && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-[#FFF7ED] border border-[#FED7AA]">
                  <div className="w-6 h-6 rounded-md bg-[#FFEDD5] flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-alert-line text-xs text-[#F97316]"></i>
                  </div>
                  <span className="text-[12px] text-[#9A3412] font-medium leading-relaxed">
                    トロフィー1,000以上はハイパーチャージ・スタパ・ギア解放キャラのみ対応
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ======== 料金表示 & 決済ボタン ======== */}
          <div
            className="mt-10 rounded-2xl p-8 relative overflow-hidden"
            style={{ background: '#1E1245' }}
          >
            <div className="flex justify-between items-center">
              <div>
                <span
                  className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8B7AFF] block mb-1"
                  style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                  Total Price
                </span>
                <span className="text-[13px] font-bold text-white">お支払い料金</span>
              </div>
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                ¥{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
              <div className="w-6 h-6 rounded-md bg-[#FEE2E2] flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-error-warning-line text-xs text-[#EF4444]"></i>
              </div>
              <span className="text-[12px] text-[#991B1B] font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {maintenance && (
            <div className="mt-6 px-4 py-3 rounded-lg border border-[#FCD34D]/40 bg-[#FFFBEB] text-center">
              <p className="text-[12px] font-semibold text-[#92400E]">現在メンテナンス中のため、新規注文を受け付けていません。</p>
            </div>
          )}
          <button
            onClick={handlePayment}
            disabled={isSubmitting || totalPrice <= 0 || maintenance}
            className="order-pay-btn mt-6 w-full bg-[#10B981] text-white py-4 rounded-xl font-bold text-[14px] tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin"></i>
                処理中...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-secure-payment-line"></i>
                決済へ進む
              </span>
            )}
          </button>
        </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
