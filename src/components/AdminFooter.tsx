'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function AdminFooter() {
  const { user } = useAuth();

  // Only show for the specific admin email
  if (!user || user.email !== 'bashirali652@icloud.com') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm text-white z-50 border-t border-white/20">
      <div className="px-4 py-2">
        <div className="flex items-center justify-center space-x-6 text-xs font-mono">
          <span className="text-green-400">●</span>
          <span className="text-white/80">Admin Mode</span>
          <span className="text-white/60">|</span>
          <span className="text-white/80">{user.email}</span>
          <span className="text-white/60">|</span>
          <span className="text-yellow-400">Owner Access</span>
        </div>
      </div>
    </div>
  );
}
