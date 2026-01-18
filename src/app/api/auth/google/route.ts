import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('Google OAuth API Route - Received params:', { code: !!code, state, error });

  if (error) {
    console.error('Google OAuth error from Google:', error);
    // Handle OAuth error from Google
    return NextResponse.redirect(
      new URL(`/login?google_login=error&error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    console.error('Missing authorization code');
    return NextResponse.redirect(
      new URL('/login?google_login=error&error=missing_code', request.url)
    );
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${new URL(request.url).origin}/api/auth/google`;

    console.log('API Route - Client ID:', clientId);
    console.log('API Route - Client Secret exists:', !!clientSecret);
    console.log('API Route - Redirect URI:', redirectUri);
    console.log('API Route - Received state:', state);

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials');
      throw new Error('Missing Google OAuth credentials');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user information from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('User info fetch failed:', errorData);
      throw new Error('Failed to get user information');
    }

    const googleUser = await userResponse.json();
    console.log('Google user data received:', googleUser);

    // Create user object for your app with REAL Google data
    const user = {
      id: 'google_' + googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
    };

    // Create session token
    const sessionToken = btoa(JSON.stringify(user));

    // Redirect back to the app with the REAL user info and state
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('google_login', 'success');
    redirectUrl.searchParams.set('user', sessionToken);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    console.log('Redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?google_login=error&error=oauth_failed', request.url)
    );
  }
}
