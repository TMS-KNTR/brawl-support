import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      service_type, 
      current_rank, 
      target_rank, 
      character_count, 
      calculated_price, 
      player_name, 
      email,
      brawler_name,
      completion_time,
      special_requests 
    } = await req.json()

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not found')
    }

    // Stripe Checkout Session作成
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price_data][currency]': 'jpy',
        'line_items[0][price_data][product_data][name]': `Brawl Stars ${service_type === 'rank' ? 'ランク上げ' : 'サービス'}`,
        'line_items[0][price_data][product_data][description]': `${current_rank ? `${current_rank} → ${target_rank}` : 'カスタムサービス'} (${character_count || 0}体)`,
        'line_items[0][price_data][unit_amount]': (calculated_price * 100).toString(),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${req.headers.get('origin')}/games/brawl-stars`,
        'customer_email': email,
        'metadata[service_type]': service_type,
        'metadata[current_rank]': current_rank || '',
        'metadata[target_rank]': target_rank || '',
        'metadata[character_count]': character_count || '',
        'metadata[player_name]': player_name,
        'metadata[brawler_name]': brawler_name || '',
        'metadata[completion_time]': completion_time,
        'metadata[special_requests]': special_requests || '',
      }),
    })

    const session = await stripeResponse.json()

    if (!stripeResponse.ok) {
      throw new Error(session.error?.message || 'Stripe session creation failed')
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})