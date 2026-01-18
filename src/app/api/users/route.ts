import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get users from localStorage (this is a simple implementation)
    // In production, you'd use a database
    const users = [
      // This would come from your database
      // For now, we'll return a message about where to find the data
    ];

    return NextResponse.json({
      message: "User data is stored in localStorage on the client side",
      instructions: [
        "1. Visit /admin/users to view all registered users",
        "2. Check browser console during checkout for user emails",
        "3. Users are stored in localStorage under 'arcstarz_users' key",
        "4. Current user session is stored under 'arcstarz_user' key"
      ],
      localStorageKeys: {
        users: "arcstarz_users",
        currentUser: "arcstarz_user",
        session: "arcstarz_session"
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
