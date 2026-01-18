import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Check if Stripe is configured
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  // Return error if Stripe is not configured
  if (!stripeSecretKey || stripeSecretKey === 'sk_test_placeholder') {
    return NextResponse.json(
      { error: 'Stripe not configured. Please add STRIPE_SECRET_KEY to environment variables.' },
      { status: 500 }
    );
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });

    const { items } = await request.json();

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `Size: ${item.selectedSize}${item.selectedColor ? `, Color: ${item.selectedColor}` : ''}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
