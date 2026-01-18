import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authenticateAdmin } from './auth';

/**
 * Middleware to protect routes requiring authentication
 */
export function requireAuth(handler: (req: NextRequest, context?: any, auth?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const authResult = authenticate(request);
    
    if (!authResult) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    return handler(request, context, authResult);
  };
}

/**
 * Middleware to protect admin routes
 */
export function requireAdmin(handler: (req: NextRequest, context?: any, auth?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const authResult = authenticateAdmin(request);
    
    if (!authResult) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    return handler(request, context, authResult);
  };
}

/**
 * Check if user has specific role
 */
export function hasRole(auth: any, requiredRole: 'user' | 'admin'): boolean {
  if (!auth || !auth.user) return false;
  
  return auth.user.role === requiredRole || auth.user.isOwner;
}

/**
 * Check if user is owner
 */
export function isOwner(auth: any): boolean {
  if (!auth || !auth.user) return false;
  
  return auth.user.isOwner === true;
}

/**
 * Validate user can access resource
 */
export function canAccessResource(auth: any, resourceUserId: string): boolean {
  if (!auth || !auth.user) return false;
  
  // Admins can access any resource
  if (auth.user.role === 'admin' || auth.user.isOwner) {
    return true;
  }
  
  // Users can only access their own resources
  return auth.user.id === resourceUserId;
}
