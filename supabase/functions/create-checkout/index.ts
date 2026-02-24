import Stripe from "esm.sh/stripe@14?target=deno";
import { createClient } from "esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const { price, userId, orderData } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: { name: "Brawl Stars 代行" },
          unit_amount: Math.round(price),
        },
        quantity: 1,
      },
    ],
    success_url: `${Deno.env.get("SITE_URL")}/order/success`,
    cancel_url: `${Deno.env.get("SITE_URL")}/order/new`,
    metadata: {
      userId,
      orderData: JSON.stringify(orderData),
    },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" },
  });
});