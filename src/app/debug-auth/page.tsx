'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugAuth() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('Debug - User object:', user);
    console.log('Debug - IsLoading:', isLoading);
    
    // Check localStorage directly
    const savedUser = localStorage.getItem('arcstarz_user');
    console.log('Debug - Saved user from localStorage:', savedUser);
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log('Debug - Parsed user:', parsedUser);
      console.log('Debug - User role:', parsedUser.role);
      console.log('Debug - User isOwner:', parsedUser.isOwner);
    }
  }, [user, isLoading]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Auth Debug Info</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Loading State:</h2>
        <p>{isLoading ? 'Loading...' : 'Not Loading'}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>User Object:</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Admin Check:</h2>
        <p>Role: {user?.role || 'undefined'}</p>
        <p>IsOwner: {user?.isOwner ? 'true' : 'false'}</p>
        <p>Has Admin Access: {user?.role === 'admin' || user?.isOwner ? 'YES' : 'NO'}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>LocalStorage:</h2>
        <pre>{localStorage.getItem('arcstarz_user') || 'No user in localStorage'}</pre>
      </div>
    </div>
  );
}
