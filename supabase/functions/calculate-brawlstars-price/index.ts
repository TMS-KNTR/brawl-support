import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Brawl Starsランクマッピング
const RANK_MAPPING = {
  'bronze1': 0, 'bronze2': 100, 'bronze3': 200,
  'silver1': 300, 'silver2': 400, 'silver3': 500,
  'gold1': 600, 'gold2': 700, 'gold3': 800,
  'diamond1': 900, 'diamond2': 1000, 'diamond3': 1100,
  'elite1': 1200, 'elite2': 1300, 'elite3': 1400,
  'legend1': 1500, 'legend2': 1600, 'legend3': 1700,
  'master1': 1800, 'master2': 1900, 'master3': 2000
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { currentRank, targetRank } = await req.json()

    // ランクの妥当性チェック
    if (!RANK_MAPPING[currentRank] || !RANK_MAPPING[targetRank]) {
      throw new Error('無効なランクが指定されました')
    }

    const currentGauges = RANK_MAPPING[currentRank]
    const targetGauges = RANK_MAPPING[targetRank]
    
    if (targetGauges <= currentGauges) {
      throw new Error('目標ランクは現在のランクより上である必要があります')
    }

    const totalGauges = targetGauges - currentGauges

    // 料金ルールを取得
    const { data: pricingRules, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('active', true)
      .order('price_per_gauge', { ascending: true })

    if (error) throw error

    // 料金計算
    let subtotal = 0
    let remainingGauges = totalGauges

    // 基本料金（最も安い料金ルールを使用）
    const baseRule = pricingRules[0]
    if (baseRule) {
      subtotal = remainingGauges * baseRule.price_per_gauge
    } else {
      // デフォルト料金
      subtotal = remainingGauges * 500
    }

    // プラットフォーム手数料（20%）
    const platformFee = Math.floor(subtotal * 0.20)
    const totalPrice = subtotal + platformFee

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          gauges: totalGauges,
          subtotal,
          platformFee,
          totalPrice,
          currency: 'JPY',
          breakdown: {
            pricePerGauge: baseRule?.price_per_gauge || 500,
            totalGauges,
            subtotal,
            platformFeeRate: '20%',
            platformFee,
            totalPrice
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})