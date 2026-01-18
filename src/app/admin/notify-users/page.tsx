'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface NotifyUser {
  id: string;
  email: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export default function AdminNotifyUsers() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notifyUsers, setNotifyUsers] = useState<NotifyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    if (user && user.role === 'admin') {
      fetchNotifyUsers();
    }
  }, [user, isLoading, router]);

  const fetchNotifyUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notify-users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notify users');
      }
      
      const data = await response.json();
      setNotifyUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching notify users:', error);
      setError('Failed to load notify users');
    } finally {
      setLoading(false);
    }
  };

  const sendBulkNotification = async () => {
    try {
      const response = await fetch('/api/admin/send-bulk-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send bulk notification');
      }

      alert('Bulk notification sent successfully!');
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      alert('Failed to send bulk notification');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="mt-4 font-body text-sm text-black/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-headline text-2xl text-black mb-4">Access Denied</h1>
          <p className="font-body text-sm text-black/60">You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-4 border-black bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image 
                src="/logos/arcstarzlogo.png" 
                alt="ARCSTARZ" 
                width={40} 
                height={40}
                className="object-contain"
              />
              <h1 className="font-headline text-xl text-white uppercase tracking-wider">
                Notify Users
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-body text-sm text-white/80">
                Admin: {user.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-4 border-black p-6">
            <h3 className="font-headline text-lg text-black uppercase tracking-wider mb-2">
              Total Users
            </h3>
            <p className="font-headline text-3xl text-black">
              {notifyUsers.length}
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-6">
            <h3 className="font-headline text-lg text-black uppercase tracking-wider mb-2">
              Active Users
            </h3>
            <p className="font-headline text-3xl text-black">
              {notifyUsers.filter(u => u.status === 'active').length}
            </p>
          </div>
          
          <div className="bg-white border-4 border-black p-6">
            <h3 className="font-headline text-lg text-black uppercase tracking-wider mb-2">
              This Month
            </h3>
            <p className="font-headline text-3xl text-black">
              {notifyUsers.filter(u => {
                const createdAt = new Date(u.createdAt);
                const now = new Date();
                return createdAt.getMonth() === now.getMonth() && 
                       createdAt.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border-4 border-black p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-headline text-lg text-black uppercase tracking-wider mb-2">
                Bulk Actions
              </h3>
              <p className="font-body text-sm text-black/60">
                Send notifications to all active users
              </p>
            </div>
            <button
              onClick={sendBulkNotification}
              className="bg-black text-white px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-black/90 transition-colors"
            >
              Send Bulk Notification
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white border-4 border-black">
          <div className="p-6 border-b-2 border-black">
            <h3 className="font-headline text-lg text-black uppercase tracking-wider">
              Notify Users List
            </h3>
          </div>
          
          {error ? (
            <div className="p-6">
              <p className="font-body text-sm text-red-600">{error}</p>
            </div>
          ) : notifyUsers.length === 0 ? (
            <div className="p-6">
              <p className="font-body text-sm text-black/60">No notify users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black">
                  <tr>
                    <th className="px-6 py-3 text-left font-body text-xs font-medium text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-body text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-body text-xs font-medium text-white uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {notifyUsers.map((notifyUser) => (
                    <tr key={notifyUser.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-body text-sm text-black">
                        {notifyUser.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-body uppercase tracking-wider ${
                          notifyUser.status === 'active' 
                            ? 'bg-black text-white' 
                            : 'bg-gray-200 text-black'
                        }`}>
                          {notifyUser.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-black">
                        {new Date(notifyUser.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
