'use client';

import { useState, useEffect } from 'react';
import { User as UserType } from '@/types/common';
import { getUserStats, getAllUsers } from '@/utils/userManager';

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  owners: number;
  recentLogins: number;
}

export default function UserMonitor() {
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    owners: 0,
    recentLogins: 0
  });
  const [users, setUsers] = useState<UserType[]>([]);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isAutoSyncing, setIsAutoSyncing] = useState(true);

  // Load initial data
  useEffect(() => {
    loadData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      if (isAutoSyncing) {
        loadData();
      }
    }, 30000); // Update every 30 seconds

    // Listen for user activity events
    const handleUserActivity = () => {
      loadData();
    };

    window.addEventListener('userLogin', handleUserActivity);
    window.addEventListener('userRegistration', handleUserActivity);
    window.addEventListener('userUpdate', handleUserActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('userLogin', handleUserActivity);
      window.removeEventListener('userRegistration', handleUserActivity);
      window.removeEventListener('userUpdate', handleUserActivity);
    };
  }, [isAutoSyncing]);

  const loadData = async () => {
    try {
      const userStats = getUserStats();
      const allUsers = getAllUsers();
      
      setStats(userStats);
      setUsers(allUsers);
      setLastSync(new Date());
      
      console.log('📊 User Monitor: Data updated', {
        stats: userStats,
        usersCount: allUsers.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ User Monitor: Failed to load data:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getRecentUsers = () => {
    return users
      .sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime())
      .slice(0, 5);
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F0] border-4 border-[#0A0A0A] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline text-xl tracking-tight">👥 USER MONITOR</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isAutoSyncing ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-body text-xs">
              {isAutoSyncing ? 'Auto-syncing' : 'Paused'}
            </span>
          </div>
          <button
            onClick={() => setIsAutoSyncing(!isAutoSyncing)}
            className="px-3 py-1 bg-[#F5F5F0] text-[#0A0A0A] text-xs font-body hover:bg-[#BFBFBF] transition-colors"
          >
            {isAutoSyncing ? '⏸️ Pause' : '▶️ Resume'}
          </button>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-[#F5F5F0] text-[#0A0A0A] text-xs font-body hover:bg-[#BFBFBF] transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="text-center">
          <div className="font-headline text-2xl tracking-tight">{stats.total}</div>
          <div className="font-body text-xs text-[#BFBFBF]">TOTAL USERS</div>
        </div>
        <div className="text-center">
          <div className="font-headline text-2xl tracking-tight text-green-400">{stats.active}</div>
          <div className="font-body text-xs text-[#BFBFBF]">ACTIVE</div>
        </div>
        <div className="text-center">
          <div className="font-headline text-2xl tracking-tight text-red-400">{stats.inactive}</div>
          <div className="font-body text-xs text-[#BFBFBF]">INACTIVE</div>
        </div>
        <div className="text-center">
          <div className="font-headline text-2xl tracking-tight text-yellow-400">{stats.owners}</div>
          <div className="font-body text-xs text-[#BFBFBF]">OWNERS</div>
        </div>
        <div className="text-center">
          <div className="font-headline text-2xl tracking-tight text-blue-400">{stats.recentLogins}</div>
          <div className="font-body text-xs text-[#BFBFBF]">RECENT (30D)</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border-t border-[#F5F5F0] border-opacity-20 pt-4">
        <h3 className="font-headline text-lg tracking-tight mb-3">📈 RECENT ACTIVITY</h3>
        <div className="space-y-2">
          {getRecentUsers().map((user) => (
            <div key={user.id} className="flex items-center justify-between bg-[#F5F5F0] bg-opacity-10 p-2 rounded">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <div className="font-body text-sm font-semibold">{user.name}</div>
                  <div className="font-body text-xs text-[#BFBFBF]">{user.email}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-body text-xs">{formatTimeAgo(user.lastLoginAt)}</div>
                <div className="font-body text-xs text-[#BFBFBF]">
                  {user.registrationType === 'google' ? '🔗 Google' : '📧 Email'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Status */}
      <div className="border-t border-[#F5F5F0] border-opacity-20 pt-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="font-body text-xs text-[#BFBFBF]">
            Last sync: {formatTimeAgo(lastSync.toISOString())}
          </div>
          <div className="font-body text-xs text-[#BFBFBF]">
            Auto-sync every 30 seconds
          </div>
        </div>
      </div>
    </div>
  );
}
