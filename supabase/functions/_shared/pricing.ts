/**
 * サーバー側料金計算ロジック（src/lib/pricing.ts と同期）
 *
 * クライアントから送信された totalPrice を検証するために使用。
 */

// ============================================
// A) ガチバトル上げ 料金テーブル
// ============================================

type PricingSegment =
  | { type: 'fixed'; from: number; to: number; price: number }
  | { type: 'range'; from: number; to: number; minPrice: number; maxPrice: number }

const RANKED_SEGMENTS: PricingSegment[] = [
  { type: 'fixed', from: 0,     to: 3000,  price: 3600 },
  { type: 'fixed', from: 3000,  to: 4500,  price: 1500 },
  { type: 'fixed', from: 4500,  to: 6000,  price: 2250 },
  { type: 'range', from: 6000,  to: 6750,  minPrice: 1400,  maxPrice: 1700 },
  { type: 'range', from: 6750,  to: 7500,  minPrice: 1600,  maxPrice: 1900 },
  { type: 'range', from: 7500,  to: 8250,  minPrice: 2600,  maxPrice: 3000 },
  { type: 'range', from: 8250,  to: 9250,  minPrice: 9000,  maxPrice: 11000 },
  { type: 'range', from: 9250,  to: 10250, minPrice: 21000, maxPrice: 27000 },
  { type: 'range', from: 10250, to: 11250, minPrice: 35000, maxPrice: 47000 },
]

function calcDiscountRatio(power11Count: number, buffyCount: number): number {
  const p11 = Math.min(Math.max(power11Count, 0), 100)
  const buf = Math.min(Math.max(buffyCount, 0), 12)
  return (p11 / 100 + buf / 12) / 2
}

export function calcRankedPrice(
  currentPoints: number,
  targetPoints: number,
  power11Count: number,
  buffyCount: number,
): number {
  if (targetPoints <= currentPoints) return 0

  const discount = calcDiscountRatio(power11Count, buffyCount)
  let total = 0

  for (const seg of RANKED_SEGMENTS) {
    const overlapStart = Math.max(currentPoints, seg.from)
    const overlapEnd = Math.min(targetPoints, seg.to)
    if (overlapStart >= overlapEnd) continue

    const overlapRatio = (overlapEnd - overlapStart) / (seg.to - seg.from)

    if (seg.type === 'fixed') {
      total += Math.round(seg.price * overlapRatio)
    } else {
      const adjustedFullPrice = seg.maxPrice - (seg.maxPrice - seg.minPrice) * discount
      total += Math.round(adjustedFullPrice * overlapRatio)
    }
  }

  return total
}

// ============================================
// B) トロフィー上げ 料金計算
// ============================================

export type BrawlerStrength = 'strong' | 'normal' | 'weak'

type TrophySegment = {
  from: number
  to: number
  prices: Record<BrawlerStrength, number>
}

const TROPHY_SEGMENTS: TrophySegment[] = [
  { from: 0,    to: 1000, prices: { strong: 3000, normal: 3000, weak: 3000 } },
  { from: 1000, to: 2000, prices: { strong: 4500, normal: 5000, weak: 5500 } },
]

export function calcTrophyPrice(
  currentTrophies: number,
  targetTrophies: number,
  strength: BrawlerStrength,
): number {
  if (targetTrophies <= currentTrophies) return 0

  let total = 0
  for (const seg of TROPHY_SEGMENTS) {
    const overlapStart = Math.max(currentTrophies, seg.from)
    const overlapEnd = Math.min(targetTrophies, seg.to)
    if (overlapStart >= overlapEnd) continue

    const ratio = (overlapEnd - overlapStart) / (seg.to - seg.from)
    total += Math.round(seg.prices[strength] * ratio)
  }

  return total
}
