import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** AES-GCM で文字列を暗号化（Base64エンコード） */
async function encryptCredential(plaintext: string): Promise<string> {
  const secret = Deno.env.get("CREDENTIAL_ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const keyData = new TextEncoder().encode(secret.slice(0, 32).padEnd(32, '0'));
  const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  // iv + ciphertext を結合してBase64
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
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

    // 注文を作成
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        current_rank: currentRank,
        target_rank: targetRank,
        game_title: 'Brawl Stars',
        service_type: serviceType || 'trophy',
        price: totalPrice,
        payout_amount: serverSubtotal,
        status: 'PAYMENT_PENDING',
        notes: notes || null
      })
      .select()
      .single()

    if (orderError) throw orderError

    // チャットスレッドを作成
    const { error: chatThreadError } = await supabase
      .from('chat_threads')
      .insert({
        order_id: order.id,
        participants: [user.id],
        last_message_at: new Date().toISOString()
      })

    if (chatThreadError) {
      console.error('チャットスレッド作成エラー:', chatThreadError)
    }

    // 認証情報保管庫を作成（AES-GCM暗号化）
    if (credentials?.username && credentials?.password) {
      const encryptedPassword = await encryptCredential(credentials.password);
      const { error: vaultError } = await supabase
        .from('credential_vaults')
        .insert({
          order_id: order.id,
          username: credentials.username,
          password_encrypted: encryptedPassword,
          notes: credentials.notes || '',
          masked_preview: `${credentials.username.substring(0, 2)}***`,
          visible_to: JSON.stringify([])
        })

      if (vaultError) throw vaultError
    }

    // Stripe Checkoutセッションを作成（冪等性キー付き）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypay'],
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
      success_url: `${req.headers.get('origin') || Deno.env.get('SITE_URL')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || Deno.env.get('SITE_URL')}/dashboard/customer`,
      metadata: {
        order_id: order.id,
        customer_id: user.id,
      },
    }, {
      idempotencyKey: `checkout-${order.id}`,
    })

    // 注文にCheckoutセッションIDを保存（payment_intent_idはWebhookで正確な値を上書き）
    await supabase
      .from('orders')
      .update({
        stripe_checkout_session_id: session.id,
        payment_intent_id: (session.payment_intent as string) || null,
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