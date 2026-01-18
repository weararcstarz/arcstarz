import { NextRequest, NextResponse } from 'next/server';
import { SecureUserService } from '@/services/secureUserService';
import { authenticateAdmin, createAuthError } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = authenticateAdmin(request);
    if (!authResult) {
      return createAuthError('Access denied', 403);
    }

    console.log('🔐 Admin access granted to users list:', authResult.user.email);

    // Get all users (admin only)
    const users = SecureUserService.getAllUsers();

    return NextResponse.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error) {
    console.error('❌ Error fetching admin users:', error);
    return createAuthError('Failed to fetch users', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = authenticateAdmin(request);
    if (!authResult) {
      return createAuthError('Access denied', 403);
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return createAuthError('User ID and updates are required', 400);
    }

    console.log('🔐 Admin updating user:', userId, 'by:', authResult.user.email);

    // Update user (admin only)
    const result = await SecureUserService.updateUser(userId, updates);

    if (!result.success) {
      return createAuthError(result.error || 'Failed to update user', 400);
    }

    return NextResponse.json({
      success: true,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Error updating admin user:', error);
    return createAuthError('Failed to update user', 500);
  }
}
