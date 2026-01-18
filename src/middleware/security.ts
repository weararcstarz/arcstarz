import { NextRequest, NextResponse } from 'next/server';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth-specific rate limiting (more strict)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Security headers configuration
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://api.paypal.com",
    "frame-src 'self' https://js.stripe.com https://www.paypal.com",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Input sanitization utilities
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function sanitizeEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeInput(email.toLowerCase().trim());
  return emailRegex.test(sanitized) ? sanitized : '';
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+\-\s()]/g, '');
}

export function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

// SQL/NoSQL injection prevention
export function sanitizeQuery(query: string): string {
  if (typeof query !== 'string') return '';
  
  // Remove potentially dangerous characters
  return query
    .replace(/['"\\;]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

// File upload security
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

export function validateFileSize(size: number, maxSize: number = 5 * 1024 * 1024): boolean {
  return size <= maxSize; // Default 5MB
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/\.\./g, '.')
    .replace(/^\.+/, '');
}

// Cookie security settings
export const secureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

// Error response sanitization
export function sanitizeErrorResponse(error: any, includeStack: boolean = false) {
  const sanitized: any = {
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development' && includeStack) {
    sanitized.stack = error.stack;
  }

  return sanitized;
}

// Request logging (production-safe)
export function logRequest(request: NextRequest, response?: any) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.url;
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ip = request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'Unknown';

  // Log in production-safe format (no sensitive data)
  console.log(`${timestamp} ${method} ${url} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}`);

  if (response && response.status >= 400) {
    console.error(`${timestamp} ERROR ${method} ${url} - Status: ${response.status}`);
  }
}

// Security middleware for Next.js
export function securityMiddleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Log request
  logRequest(request);

  return response;
}
