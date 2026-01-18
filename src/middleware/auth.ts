import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { SecurityUtils, RateLimiter } from '@/utils/security';

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  registrationType: string;
  isOwner: boolean;
}

export interface AuthToken {
  user: AuthUser;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(user: any): string {
  const payload: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.isOwner ? 'admin' : 'user',
    registrationType: user.registrationType,
    isOwner: user.isOwner || false
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'arcstarz',
    audience: 'arcstarz-users'
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'arcstarz',
      audience: 'arcstarz-users'
    }) as AuthToken;
    
    return decoded;
  } catch (error: any) {
    console.log('Token verification failed:', error?.message || 'Unknown error');
    return null;
  }
}

/**
 * Extract token from request
 */
export function extractToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies as fallback
  return request.cookies.get('auth_token')?.value || null;
}

/**
 * Authentication middleware
 */
export function authenticate(request: NextRequest): AuthToken | null {
  const token = extractToken(request);
  
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Admin authentication middleware
 */
export function authenticateAdmin(request: NextRequest): AuthToken | null {
  const authResult = authenticate(request);
  
  if (!authResult) {
    return null;
  }

  // Verify admin role
  if (authResult.user.role !== 'admin' && !authResult.user.isOwner) {
    console.log('Access denied: User is not admin', authResult.user.email);
    return null;
  }

  return authResult;
}

/**
 * Rate limiting middleware for auth endpoints
 */
export function checkRateLimit(identifier: string): { allowed: boolean; remaining?: number; lockoutTime?: number } {
  if (RateLimiter.isLocked(identifier)) {
    return {
      allowed: false,
      lockoutTime: RateLimiter.getLockoutTimeRemaining(identifier)
    };
  }

  const allowed = RateLimiter.recordAttempt(identifier);
  return {
    allowed,
    remaining: RateLimiter.getRemainingAttempts(identifier)
  };
}

/**
 * Create standardized auth response
 */
export function createAuthResponse(user: any, includeToken: boolean = true) {
  const sanitizedUser = SecurityUtils.sanitizeUserData(user);
  
  const response: any = {
    success: true,
    user: sanitizedUser
  };

  if (includeToken) {
    response.token = generateToken(user);
    response.expiresIn = JWT_EXPIRES_IN;
  }

  return response;
}

/**
 * Create standardized error response
 */
export function createAuthError(message: string, status: number = 401) {
  // Always return generic error message to prevent information disclosure
  const genericMessage = status === 401 ? 'Invalid credentials' : message;
  
  return NextResponse.json({
    success: false,
    error: genericMessage
  }, { status });
}

/**
 * Validate password strength
 */
export function validatePasswordRequirements(password: string): { isValid: boolean; errors: string[] } {
  return SecurityUtils.validatePasswordStrength(password);
}

/**
 * Validate email format
 */
export function validateEmailFormat(email: string): boolean {
  return SecurityUtils.isValidEmail(email);
}
