import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { getCorsHeaders, handleCors, requireJsonContentType } from '../_shared/cors.ts'
import { calcRankedPrice, calcTrophyPrice } from '../_shared/pricing.ts'
import type { BrawlerStrength } from '../_shared/pricing.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  const corsHeaders = getCorsHeaders(req)

  try {
    requireJsonContentType(req)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // JWTトークンから認証情報を取得
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('認証が必要です')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('認証が必要です')
    }

    // ロールチェック: 顧客のみ注文作成可能
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, is_banned')
      .eq('id', user.id)
      .single()

    if (userProfile?.is_banned) {
      throw new Error('アカウントが停止されています')
    }
    if (userProfile?.role !== 'customer' && userProfile?.role !== 'client') {
      throw new Error('注文は依頼者アカウントからのみ作成できます')
    }

    // レートリミット: 同一ユーザーの短期間の大量注文を防止
    const { count: recentOrderCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    if ((recentOrderCount ?? 0) >= 10) {
      throw new Error('短時間に多くの注文が作成されました。しばらく時間を置いてからお試しください。')
    }

    // メンテナンスモードチェック
    const { data: maintenanceSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single()
    if (maintenanceSetting?.value === true || maintenanceSetting?.value === 'true') {
      throw new Error('現在メンテナンス中のため、新規注文を受け付けておりません')
    }

    // system_settings から手数料率を取得
    const { data: feeRateSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'platform_fee_rate')
      .single()
    const feeRate = Number(feeRateSetting?.value) || 0.20

    const {
      currentRank,
      targetRank,
      serviceType,
      region,
      notes,
      totalPrice,
      // 料金検証に必要な追加パラメータ
      power11Count,
      buffyCount,
      brawlerStrength,
    } = await req.json()

    // --- サーバー側で料金を再計算して検証 ---
    const currentVal = Number(currentRank) || 0
    const targetVal = Number(targetRank) || 0

    let serverPrice: number
    if (serviceType === 'rank') {
      serverPrice = calcRankedPrice(
        currentVal,
        targetVal,
        Number(power11Count) || 0,
        Number(buffyCount) || 0,
      )
    } else {
      const strength: BrawlerStrength =
        ['strong', 'normal', 'weak'].includes(brawlerStrength)
          ? brawlerStrength
          : 'normal'
      serverPrice = calcTrophyPrice(currentVal, targetVal, strength)
    }

    // クライアント送信額がサーバー計算額と一致するか検証
    if (serverPrice <= 0) {
      throw new Error('目標値は現在値より大きく設定してください')
    }
    // 上限チェック（異常な金額を弾く）
    const MAX_PRICE = 500_000  // ¥500,000
    if (serverPrice > MAX_PRICE) {
      throw new Error('料金が上限を超えています。内容をご確認ください。')
    }
    if (Number(totalPrice) !== serverPrice) {
      console.error(`Price mismatch: client=${totalPrice}, server=${serverPrice}`)
      throw new Error('料金が正しくありません。ページを再読み込みしてお試しください。')
    }

    const serverPlatformFee = Math.round(serverPrice * feeRate)
    const serverSubtotal = serverPrice - serverPlatformFee

    const siteUrl = Deno.env.get('SITE_URL') || ''

    // Stripe Checkoutセッションを作成（注文はWebhookで決済完了後に作成）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // PayPayはStripeプレビュー段階のため未対応
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `Brawl Stars代行 ${currentRank} → ${targetRank}`,
              description: `${serviceType === 'rank' ? 'ガチバトル上げ' : 'トロフィー上げ'}`,
            },
            unit_amount: serverPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/dashboard/customer`,
      metadata: {
        customer_id: user.id,
        current_rank: currentRank,
        target_rank: targetRank,
        service_type: serviceType || 'trophy',
        notes: notes || '',
        total_price: String(serverPrice),
        payout_amount: String(serverSubtotal),
        platform_fee: String(serverPlatformFee),
      },
    }, {
      // 冪等性キー（同一秒内の重複送信を防止しつつ、再注文は許可）
      idempotencyKey: `checkout-${user.id}-${serviceType}-${currentRank}-${targetRank}-${serverPrice}-${Math.floor(Date.now() / 10000)}`,
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          checkoutUrl: session.url
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
