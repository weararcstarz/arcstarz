import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test endpoint hit');
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      received: body
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test endpoint GET working'
  });
}
