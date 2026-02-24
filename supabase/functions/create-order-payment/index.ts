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

    const { 
      currentRank, 
      targetRank, 
      region, 
      notes, 
      credentials,
      totalPrice,
      subtotal,
      platformFee 
    } = await req.json()

    // 注文を作成
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        current_rank: currentRank,
        target_rank: targetRank,
        region,
        price_subtotal: subtotal,
        platform_fee: platformFee,
        total_price: totalPrice,
        status: 'PAYMENT_PENDING'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // チャットスレッドを作成
    const { error: chatThreadError } = await supabase
      .from('chat_threads')
      .insert({
        order_id: order.id,
        participants: JSON.stringify([user.id]),
        last_message_at: new Date().toISOString()
      })

    if (chatThreadError) {
      console.error('チャットスレッド作成エラー:', chatThreadError)
    }

    // 認証情報保管庫を作成
    if (credentials?.username && credentials?.password) {
      const { error: vaultError } = await supabase
        .from('credential_vaults')
        .insert({
          order_id: order.id,
          username: credentials.username,
          password_encrypted: credentials.password, // 実際の実装では暗号化が必要
          notes: credentials.notes || '',
          masked_preview: `${credentials.username.substring(0, 2)}***`,
          visible_to: JSON.stringify([])
        })

      if (vaultError) throw vaultError
    }

    // Stripe Checkoutセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `Brawl Stars代行 ${currentRank} → ${targetRank}`,
              description: `地域: ${region || '指定なし'}`,
            },
            unit_amount: totalPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/dashboard/customer`,
      metadata: {
        order_id: order.id,
        customer_id: user.id,
      },
    })

    // 注文にセッションIDを更新
    await supabase
      .from('orders')
      .update({ 
        stripe_checkout_session_id: session.id,
        status: 'PAYMENT_PENDING'
      })
      .eq('id', order.id)

    // 監査ログを記録（admin_logs に統一）
    await supabase
      .from('admin_logs')
      .insert({
        actor_user_id: user.id,
        action: 'ORDER_CREATED',
        target_type: 'order',
        target_id: order.id,
        meta_json: {
          currentRank,
          targetRank,
          totalPrice,
          sessionId: session.id
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderId: order.id,
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