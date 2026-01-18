import jwt from 'jsonwebtoken';
import { env } from './envValidation';

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isOwner: boolean;
  iat: number;
  exp: number;
}

export class AuthVerificationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthVerificationError';
  }
}

export function verifyToken(token: string): TokenPayload {
  try {
    if (!token) {
      throw new AuthVerificationError('No token provided', 'NO_TOKEN');
    }

    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'arcstarz',
      audience: 'arcstarz-users'
    }) as TokenPayload;

    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      throw new AuthVerificationError('Token has expired', 'TOKEN_EXPIRED');
    }

    return decoded;
  } catch (error) {
    if (error instanceof AuthVerificationError) {
      throw error;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthVerificationError('Token has expired', 'TOKEN_EXPIRED');
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthVerificationError('Invalid token', 'INVALID_TOKEN');
    }
    
    throw new AuthVerificationError('Token verification failed', 'VERIFICATION_FAILED');
  }
}

export function requireAuth(token: string): TokenPayload {
  try {
    return verifyToken(token);
  } catch (error) {
    if (error instanceof AuthVerificationError) {
      throw error;
    }
    throw new AuthVerificationError('Authentication required', 'AUTH_REQUIRED');
  }
}

export function requireAdmin(token: string): TokenPayload {
  const payload = requireAuth(token);
  
  if (payload.role !== 'admin' && !payload.isOwner) {
    throw new AuthVerificationError('Admin access required', 'ADMIN_REQUIRED');
  }
  
  return payload;
}

export function requireOwner(token: string): TokenPayload {
  const payload = requireAuth(token);
  
  if (!payload.isOwner) {
    throw new AuthVerificationError('Owner access required', 'OWNER_REQUIRED');
  }
  
  return payload;
}

export function checkResourceAccess(token: string, resourceUserId: string): boolean {
  try {
    const payload = verifyToken(token);
    
    // Admins and owners can access any resource
    if (payload.role === 'admin' || payload.isOwner) {
      return true;
    }
    
    // Users can only access their own resources
    return payload.id === resourceUserId;
  } catch {
    return false;
  }
}

export function createAuthToken(user: {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isOwner: boolean;
}): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isOwner: user.isOwner
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'arcstarz',
    audience: 'arcstarz-users',
    subject: user.id
  });
}

export function refreshToken(oldToken: string): string {
  const payload = verifyToken(oldToken);
  
  // Create new token with same payload but new expiration
  return createAuthToken({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    isOwner: payload.isOwner
  });
}

export function invalidateToken(token: string): boolean {
  try {
    // In a real implementation, you would add the token to a blacklist
    // For now, we'll just verify it's valid and let it expire naturally
    verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

// Middleware helper functions
export function getAuthFromRequest(request: Request): TokenPayload | null {
  const authHeader = request.headers.get('authorization');
  const cookieToken = (request as any).cookies?.auth_token;
  
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : cookieToken;
    
  if (!token) return null;
  
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function withAuth(handler: (req: Request, auth: TokenPayload) => Promise<Response>) {
  return async (request: Request) => {
    const auth = getAuthFromRequest(request);
    
    if (!auth) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(request, auth);
  };
}

export function withAdmin(handler: (req: Request, auth: TokenPayload) => Promise<Response>) {
  return async (request: Request) => {
    const auth = getAuthFromRequest(request);
    
    if (!auth) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (auth.role !== 'admin' && !auth.isOwner) {
      return Response.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(request, auth);
  };
}

export function withOwner(handler: (req: Request, auth: TokenPayload) => Promise<Response>) {
  return async (request: Request) => {
    const auth = getAuthFromRequest(request);
    
    if (!auth) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!auth.isOwner) {
      return Response.json(
        { error: 'Owner access required' },
        { status: 403 }
      );
    }
    
    return handler(request, auth);
  };
}

// Token validation utilities
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded ? decoded.exp * 1000 < Date.now() : true;
  } catch {
    return true;
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded ? new Date(decoded.exp * 1000) : null;
  } catch {
    return null;
  }
}

export function getTimeUntilExpiration(token: string): number {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration.getTime() - Date.now() : 0;
}
