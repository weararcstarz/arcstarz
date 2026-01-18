import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    // Forward request to Express backend
    const backendUrl = 'http://localhost:3001/api/users/secure-login';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || 'unknown',
        'X-Real-IP': request.headers.get('x-real-ip') || 'unknown',
        'User-Agent': request.headers.get('user-agent') || 'unknown',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    // Return the same response from backend
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Next.js API proxy error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login service unavailable'
    }, { status: 500 });
  }
}
