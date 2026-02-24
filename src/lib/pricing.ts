/**
 * Brawl Stars 代行料金計算ロジック
 *
 * A) ガチバトル上げ — ポイント帯ごとの段階課金
 *    0〜6000: 固定料金（キャラ数・バフィー数で変動なし）
 *    6000〜: レンジ帯（キャラ数・バフィー数で安くなる）
 *
 * B) トロフィー上げ — キャラ強弱で補正
 */

// ============================================
// A) ガチバトル上げ 料金テーブル
// ============================================

type PricingSegment =
  | { type: 'fixed'; from: number; to: number; price: number }
  | { type: 'range'; from: number; to: number; minPrice: number; maxPrice: number }

const RANKED_SEGMENTS: PricingSegment[] = [
  // 固定帯（キャラ数で変動なし。帯全体でこの料金）
  { type: 'fixed', from: 0,     to: 3000,  price: 3600 },
  { type: 'fixed', from: 3000,  to: 4500,  price: 1500 },
  { type: 'fixed', from: 4500,  to: 6000,  price: 2250 },
  // レンジ帯（パワー11キャラ数・バフィー数で変動。多いほど安い）
  { type: 'range', from: 6000,  to: 6750,  minPrice: 1400,  maxPrice: 1700 },
  { type: 'range', from: 6750,  to: 7500,  minPrice: 1600,  maxPrice: 1900 },
  { type: 'range', from: 7500,  to: 8250,  minPrice: 2600,  maxPrice: 3000 },
  { type: 'range', from: 8250,  to: 9250,  minPrice: 9000,  maxPrice: 11000 },
  { type: 'range', from: 9250,  to: 10250, minPrice: 15000, maxPrice: 20000 },
  { type: 'range', from: 10250, to: 11250, minPrice: 35000, maxPrice: 40000 },
]

/**
 * パワー11キャラ数・バフィー数から割引率を計算（0〜1）
 * 1に近いほど安くなる（minPrice側に寄る）
 *
 * @param power11Count パワー11キャラ数（0〜98）
 * @param buffyCount   バフィー数（0〜36）
 * @returns 割引率 0〜1
 */
function calcDiscountRatio(power11Count: number, buffyCount: number): number {
  const p11 = Math.min(Math.max(power11Count, 0), 98)
  const buf = Math.min(Math.max(buffyCount, 0), 36)

  const p11Ratio = p11 / 98  // 0〜1
  const bufRatio = buf / 36  // 0〜1

  // 両方の重要度は同じ（50:50）
  return (p11Ratio + bufRatio) / 2
}

export type SegmentBreakdown = {
  from: number
  to: number
  price: number
  label: string
}

/**
 * ガチバトル上げの料金を計算
 *
 * @param currentPoints 現在のランクポイント
 * @param targetPoints  目標のランクポイント
 * @param power11Count  パワー11キャラ数（0〜98）
 * @param buffyCount    バフィー数（0〜36）
 * @returns 合計料金（円）と内訳
 */
export function calcRankedPrice(
  currentPoints: number,
  targetPoints: number,
  power11Count: number,
  buffyCount: number
): { total: number; breakdown: SegmentBreakdown[] } {
  if (targetPoints <= currentPoints) {
    return { total: 0, breakdown: [] }
  }

  const discount = calcDiscountRatio(power11Count, buffyCount)
  const breakdown: SegmentBreakdown[] = []
  let total = 0

  for (const seg of RANKED_SEGMENTS) {
    // このセグメントと依頼範囲の重なりを計算
    const overlapStart = Math.max(currentPoints, seg.from)
    const overlapEnd = Math.min(targetPoints, seg.to)

    if (overlapStart >= overlapEnd) continue // 重なりなし

    const overlapSize = overlapEnd - overlapStart
    const segmentSize = seg.to - seg.from
    const overlapRatio = overlapSize / segmentSize // セグメント内の何%をカバーするか

    let segPrice = 0

    if (seg.type === 'fixed') {
      // 固定帯：帯全体の料金 × 通過割合（途中からでも按分）
      segPrice = Math.round(seg.price * overlapRatio)
    } else {
      // レンジ帯：discount=1（キャラ多い）→ minPrice、discount=0（キャラ少ない）→ maxPrice
      const adjustedFullPrice = seg.maxPrice - (seg.maxPrice - seg.minPrice) * discount
      segPrice = Math.round(adjustedFullPrice * overlapRatio)
    }

    total += segPrice
    breakdown.push({
      from: overlapStart,
      to: overlapEnd,
      price: segPrice,
      label: `${seg.from.toLocaleString()}〜${seg.to.toLocaleString()}`,
    })
  }

  return { total, breakdown }
}

// ============================================
// B) トロフィー上げ 料金計算
// ============================================

type CharacterStrength = 'strong' | 'normal' | 'weak'

/**
 * トロフィー上げの料金を計算
 *
 * 基本単価：1トロフィーあたり2円
 * 強キャラ：×0.8（安くなる — 勝ちやすいから）
 * 中キャラ：×1.0
 * 弱キャラ：×1.3（高くなる — 勝ちにくいから）
 */
export function calcTrophyPrice(
  currentTrophies: number,
  targetTrophies: number,
  strength: CharacterStrength
): number {
  const diff = Math.max(targetTrophies - currentTrophies, 0)
  const basePricePerTrophy = 2

  const multiplier =
    strength === 'strong' ? 0.8 :
    strength === 'weak' ? 1.3 : 1.0

  return Math.round(diff * basePricePerTrophy * multiplier)
}
