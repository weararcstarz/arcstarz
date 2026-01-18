import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { users, timestamp } = await request.json();

    // Validate request data
    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Invalid users data' },
        { status: 400 }
      );
    }

    // Path to users.json file
    const usersFilePath = path.join(process.cwd(), 'users.json');
    
    // Read current users.json to verify
    let currentUsers = [];
    try {
      const currentData = fs.readFileSync(usersFilePath, 'utf8');
      currentUsers = JSON.parse(currentData);
    } catch (error) {
      console.error('Error reading current users.json:', error);
    }

    // Merge users - update existing, add new
    const mergedUsers = [...currentUsers];
    
    users.forEach((newUser: any) => {
      const existingIndex = mergedUsers.findIndex((u: any) => u.id === newUser.id);
      
      if (existingIndex !== -1) {
        // Update existing user
        mergedUsers[existingIndex] = {
          ...mergedUsers[existingIndex],
          ...newUser,
          updatedAt: timestamp
        };
      } else {
        // Add new user
        mergedUsers.push({
          ...newUser,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    });

    // Sort users by creation date (newest first)
    mergedUsers.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Write back to users.json
    fs.writeFileSync(usersFilePath, JSON.stringify(mergedUsers, null, 2), 'utf8');

    console.log(`✅ Users synchronized: ${users.length} updates processed at ${timestamp}`);

    return NextResponse.json({
      success: true,
      message: 'Users synchronized successfully',
      usersCount: mergedUsers.length,
      timestamp,
      updatesProcessed: users.length
    });

  } catch (error) {
    console.error('❌ Error syncing users:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to synchronize users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current users for verification
    const usersFilePath = path.join(process.cwd(), 'users.json');
    const usersData = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(usersData);

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
      lastSync: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting users:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
