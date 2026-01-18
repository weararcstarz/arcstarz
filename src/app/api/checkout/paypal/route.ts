import { NextRequest, NextResponse } from 'next/server';
import { createOrderFromCheckout } from '@/lib/orderCreation';

export async function POST(request: NextRequest) {
  try {
    const { items, total, customerEmail, customerName, shippingDetails } = await request.json();
    
    console.log('PayPal checkout request:', { items, total });
    if (process.env.NODE_ENV === 'development') {
      console.log('Customer info:', { customerEmail, customerName, shippingDetails });
    }

    // PayPal API endpoint for creating orders
    const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get credentials from environment
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    console.log('PayPal credentials check:', { 
      clientId: clientId?.substring(0, 10) + '...',
      clientSecret: clientSecret?.substring(0, 10) + '...',
      apiBase: PAYPAL_API_BASE
    });

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    // Get access token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenText = await tokenResponse.text();
    console.log('PayPal token response:', { status: tokenResponse.status, text: tokenText });

    if (!tokenResponse.ok) {
      console.error('PayPal token error details:', tokenText);
      throw new Error(`PayPal auth failed: ${tokenText}`);
    }

    const tokenData = JSON.parse(tokenText);
    const { access_token } = tokenData;

    if (!access_token) {
      throw new Error('No access token received from PayPal');
    }

    // Create PayPal order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: (total / 100).toFixed(2), // Convert cents to dollars
          },
          description: 'ARCSTARZ Purchase',
          custom_id: `${customerEmail || 'guest'}_${Date.now()}`, // Custom ID with email
        soft_descriptor: `ARCSTARZ ${customerName || 'Customer'}`,
        },
      ],
      application_context: {
        brand_name: 'ARCSTARZ',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/thank-you?payment_method=paypal`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout`,
      },
    };

    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const orderText = await orderResponse.text();
    console.log('PayPal order response:', { status: orderResponse.status, text: orderText });

    if (!orderResponse.ok) {
      console.error('PayPal order error details:', orderText);
      throw new Error(`PayPal order creation failed: ${orderText}`);
    }

    const order = JSON.parse(orderText);
    console.log('PayPal order created:', { orderId: order.id });

    const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      throw new Error('No approval URL received from PayPal');
    }

    // Create order record
    try {
      const createdOrder = createOrderFromCheckout({
        customerEmail: customerEmail || '',
        customerName: customerName || 'Customer',
        loginMethod: 'email', // Default, could be determined from user context
        shippingDetails: shippingDetails || {},
        items,
        total,
        paymentProvider: 'paypal',
        transactionId: order.id,
        paymentMethod: {
          type: 'paypal',
          wallet: customerEmail || ''
        }
      });
      
      console.log('Order created:', { orderId: createdOrder.id, orderNumber: createdOrder.orderNumber });
    } catch (orderError) {
      console.error('Error creating order:', orderError);
      // Continue with checkout even if order creation fails
    }

    return NextResponse.json({ 
      orderId: order.id,
      approvalUrl: approvalUrl 
    });
  } catch (error) {
    console.error('PayPal checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
