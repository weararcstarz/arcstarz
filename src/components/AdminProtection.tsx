'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdminProtectionProps {
  children: React.ReactNode;
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('AdminProtection - User:', user);
    console.log('AdminProtection - IsLoading:', isLoading);
    console.log('AdminProtection - User role:', user?.role);
    console.log('AdminProtection - User isOwner:', user?.isOwner);
    
    if (!isLoading) {
      if (!user) {
        console.log('AdminProtection - No user, redirecting to login');
        router.push('/login');
        return;
      }
      
      // Check if user is the specific admin (bashirali652@icloud.com) OR has admin role/owner privileges
      const isAdminEmail = user.email === 'bashirali652@icloud.com';
      const hasAdminPrivileges = user.role === 'admin' || user.isOwner;
      
      if (!isAdminEmail && !hasAdminPrivileges) {
        console.log('AdminProtection - User not authorized, redirecting to shop');
        router.push('/shop');
        return;
      }
      
      console.log('AdminProtection - User has admin access');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="mt-4 font-body text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.email !== 'bashirali652@icloud.com' && user.role !== 'admin' && !user.isOwner)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
