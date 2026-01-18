import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Owner-only routes
const OWNER_ROUTES = [
  '/admin/orders',
  '/admin/orders/',
  '/admin/users',
  '/admin/users/',
  '/admin/email',
  '/admin/email/',
  '/api/admin/orders',
  '/api/admin/orders/',
  '/api/admin/users',
  '/api/admin/users/'
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is an admin route
  const isAdminRoute = OWNER_ROUTES.some(route => pathname.startsWith(route));
  
  if (isAdminRoute) {
    // Check for owner token in cookie/header as additional security
    const ownerToken = request.cookies.get('owner_token')?.value || 
                      request.headers.get('x-owner-token');
    
    if (ownerToken && ownerToken === process.env.OWNER_TOKEN) {
      return NextResponse.next();
    }
    
    // If no owner token, let the component handle the check
    // This allows for proper redirect to login with error message
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/orders/:path*',
    '/admin/users/:path*',
    '/admin/email/:path*',
    '/api/admin/orders/:path*',
    '/api/admin/users/:path*'
  ]
};
