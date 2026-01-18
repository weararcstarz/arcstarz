import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const serverClientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return NextResponse.json({
    clientId: clientId || 'NOT_FOUND',
    serverClientId: serverClientId || 'NOT_FOUND',
    clientSecretExists: !!clientSecret,
    environment: process.env.NODE_ENV,
  });
}
