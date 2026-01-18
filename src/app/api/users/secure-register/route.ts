import { NextRequest, NextResponse } from 'next/server';
import { SecureUserService } from '@/services/secureUserService';
import { createAuthResponse, createAuthError, checkRateLimit } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Rate limiting check
    const rateLimitResult = checkRateLimit(`register:${clientIP}`);
    if (!rateLimitResult.allowed) {
      return createAuthError('Too many registration attempts. Please try again later.', 429);
    }

    const body = await request.json();
    const { name, email, password, registrationType = 'email', registrationSource = 'registration_form' } = body;

    // Validate required fields
    if (!name || !email || (registrationType === 'email' && !password)) {
      return createAuthError('Name, email, and password are required', 400);
    }

    // Create user with comprehensive validation
    const result = await SecureUserService.createUser({
      name: name.trim(),
      email: email.trim(),
      password,
      registrationType,
      registrationSource
    });

    if (!result.success) {
      return createAuthError(result.error || 'Registration failed', 400);
    }

    console.log('✅ User registered successfully:', result.user?.email);
    
    // Return success response with token
    return NextResponse.json(createAuthResponse(result.user));

  } catch (error) {
    console.error('❌ Registration error:', error);
    return createAuthError('Registration failed', 500);
  }
}
