'use client';

import { useEffect } from 'react';

export default function UserSyncInitializer() {
  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      import('@/services/userSyncService').then(() => {
        console.log('🚀 User Sync Service: Initialized from client component');
      }).catch((error) => {
        console.error('❌ User Sync Service: Failed to initialize:', error);
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
