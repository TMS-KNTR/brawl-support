import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // JWTトークンから認証情報を取得
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('認証が必要です')
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
      credentials,
      totalPrice,
    } = await req.json()

    // サーバー側で手数料を再計算（クライアント値を信用しない）
    const serverPlatformFee = Math.round(totalPrice * feeRate)
    const serverSubtotal = totalPrice - serverPlatformFee

    // Stripe Checkoutセッションを作成（注文はWebhookで決済完了後に作成）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypay'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `Brawl Stars代行 ${currentRank} → ${targetRank}`,
              description: `${serviceType === 'rank' ? 'ガチバトル上げ' : 'トロフィー上げ'}`,
            },
            unit_amount: totalPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin') || Deno.env.get('SITE_URL')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || Deno.env.get('SITE_URL')}/dashboard/customer`,
      metadata: {
        customer_id: user.id,
        current_rank: currentRank,
        target_rank: targetRank,
        service_type: serviceType || 'trophy',
        notes: notes || '',
        total_price: String(totalPrice),
        payout_amount: String(serverSubtotal),
        platform_fee: String(serverPlatformFee),
      },
    }, {
      idempotencyKey: `checkout-${user.id}-${Date.now()}`,
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
