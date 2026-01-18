import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    console.log('PayPal credentials test:', { 
      clientId: clientId?.substring(0, 10) + '...',
      clientSecret: clientSecret?.substring(0, 10) + '...',
      clientIdLength: clientId?.length,
      secretLength: clientSecret?.length
    });

    // Test both sandbox and live endpoints
    const endpoints = [
      { name: 'Sandbox', url: 'https://api-m.sandbox.paypal.com' },
      { name: 'Live', url: 'https://api-m.paypal.com' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        const response = await fetch(`${endpoint.url}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          },
          body: 'grant_type=client_credentials',
        });

        const text = await response.text();
        
        results.push({
          endpoint: endpoint.name,
          status: response.status,
          success: response.ok,
          response: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        });
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          status: 'ERROR',
          success: false,
          response: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('PayPal test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
