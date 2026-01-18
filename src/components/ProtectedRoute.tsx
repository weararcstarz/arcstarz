'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute - User:', user);
    console.log('ProtectedRoute - IsLoading:', isLoading);
    
    // Only redirect if we're sure there's no user and we're done loading
    if (!isLoading && !user) {
      console.log('ProtectedRoute - Redirecting to login');
      router.push('/login');
    } else if (!isLoading && user) {
      console.log('ProtectedRoute - User authenticated, allowing access');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <h1 className="font-headline text-2xl tracking-tight mb-4">LOADING...</h1>
            <div className="w-16 h-1 bg-[#0A0A0A] mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!user) {
    console.log('ProtectedRoute - No user found, returning null');
    return null;
  }

  // If authenticated, render children
  console.log('ProtectedRoute - Rendering protected content');
  return <>{children}</>;
}
