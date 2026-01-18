import { NextRequest, NextResponse } from 'next/server';

// Mock data for notify users - in production, this would come from your database
const mockNotifyUsers = [
  {
    id: '1',
    email: 'user1@example.com',
    createdAt: new Date('2024-01-15').toISOString(),
    status: 'active'
  },
  {
    id: '2', 
    email: 'user2@example.com',
    createdAt: new Date('2024-01-10').toISOString(),
    status: 'active'
  },
  {
    id: '3',
    email: 'user3@example.com', 
    createdAt: new Date('2024-01-05').toISOString(),
    status: 'inactive'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Simple auth check - in production, verify admin token properly
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For now, just check if token exists - implement proper admin verification in production

    // Return notify users data
    return NextResponse.json({
      success: true,
      users: mockNotifyUsers
    });

  } catch (error) {
    console.error('Notify users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
