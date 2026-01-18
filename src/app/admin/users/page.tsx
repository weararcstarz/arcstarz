'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType, ShippingDetails } from '@/types/common';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || '1767942289962';
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'bashirali652@icloud.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  name: string;
  email: string;
  registrationType: string;
  registrationSource: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  isOwner: boolean;
}

export default function AdminUsers() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingData, setShippingData] = useState<ShippingDetails[]>([]);

  // Check if user is owner
  const isOwner = user?.id === OWNER_ID || user?.email === OWNER_EMAIL;

  useEffect(() => {
    // Wait for auth to load before checking ownership
    if (authLoading) return;
    
    if (!isOwner) {
      router.push('/404');
      return;
    }
    loadUsers();
  }, [isOwner, router, authLoading]);

  // Load users from backend API
  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        console.log('Users fetched from backend:', data);
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users from backend API');
        // Fallback to localStorage if API fails
        const storedUsers = JSON.parse(localStorage.getItem('arcstarz_users') || '[]');
        setUsers(storedUsers);
      }
    } catch (error) {
      console.error('Error loading users from backend:', error);
      // Fallback to localStorage if backend is not running
      const storedUsers = JSON.parse(localStorage.getItem('arcstarz_users') || '[]');
      setUsers(storedUsers);
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `arcstarz_users_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Show loading while auth is initializing
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-black border-t-transparent mb-4"></div>
            <p className="font-body text-sm md:text-base text-black">Loading users...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  if (false) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-black border-t-transparent mb-4"></div>
            <p className="font-body text-sm md:text-base text-black">Loading users...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="font-headline text-2xl md:text-4xl tracking-tight mb-2 md:mb-4 text-black">
              USER MANAGEMENT
            </h1>
            <p className="font-body text-xs md:text-sm tracking-wide text-black/60">
              Registered customers
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="bg-white border border-black/10 p-4 md:p-6 hover:shadow-lg transition-all">
              <h3 className="font-headline text-xl md:text-2xl tracking-tight text-black">{users.length}</h3>
              <p className="font-body text-xs md:text-sm text-black/60">Total Users</p>
            </div>
            <div className="bg-green-50 border border-green-200 p-4 md:p-6 hover:shadow-lg transition-all">
              <h3 className="font-headline text-xl md:text-2xl tracking-tight text-green-800">
                {users.filter(u => u.isActive !== false).length}
              </h3>
              <p className="font-body text-xs md:text-sm text-green-600">Active Users</p>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 md:p-6 hover:shadow-lg transition-all">
              <h3 className="font-headline text-xl md:text-2xl tracking-tight text-red-800">
                {users.filter(u => u.isActive === false).length}
              </h3>
              <p className="font-body text-xs md:text-sm text-red-600">Inactive Users</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 md:p-6 hover:shadow-lg transition-all">
              <h3 className="font-headline text-xl md:text-2xl tracking-tight text-blue-800">
                {users.filter(u => u.registrationType === 'google').length}
              </h3>
              <p className="font-body text-xs md:text-sm text-blue-600">Google Signups</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 mb-6 md:mb-8">
            <button
              onClick={exportUsers}
              className="w-full md:w-auto bg-black text-white px-6 py-3 text-sm font-body font-medium hover:bg-gray-800 transition-all"
            >
              📥 Export Users
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full md:w-auto px-6 py-3 border border-black/20 bg-white text-black font-body text-sm font-medium hover:bg-black/5 transition-all"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-black/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10 bg-gray-50">
                    <th className="text-left p-3 md:p-4 font-body text-xs md:text-sm font-medium text-black">Name</th>
                    <th className="text-left p-3 md:p-4 font-body text-xs md:text-sm font-medium text-black">Email</th>
                    <th className="text-left p-3 md:p-4 font-body text-xs md:text-sm font-medium text-black">Type</th>
                    <th className="text-left p-3 md:p-4 font-body text-xs md:text-sm font-medium text-black">Registered</th>
                    <th className="text-left p-3 md:p-4 font-body text-xs md:text-sm font-medium text-black">Last Login</th>
                    <th className="text-left p-3 md:p-4 font-body text-xs md:text-sm font-medium text-black">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={`${user.id}-${user.email}-${index}`} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                      <td className="p-3 md:p-4 font-body text-xs md:text-sm text-black">
                        {user.name || 'Not provided'}
                        {user.isOwner && <span className="ml-2 text-xs bg-black text-white px-2 py-1 rounded">OWNER</span>}
                      </td>
                      <td className="p-3 md:p-4 font-body text-xs md:text-sm text-black/70">{user.email}</td>
                      <td className="p-3 md:p-4">
                        <span className={`inline-block px-2 py-1 text-xs font-body font-medium rounded ${
                          user.registrationType === 'google' 
                            ? 'bg-blue-500 text-white' 
                            : user.registrationType === 'email'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {user.registrationType?.toUpperCase() || 'EMAIL'}
                        </span>
                      </td>
                      <td className="p-3 md:p-4 font-body text-xs md:text-sm text-black/70">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 md:p-4 font-body text-xs md:text-sm text-black/70">
                        {new Date(user.lastLoginAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 md:p-4">
                        <span className={`inline-block px-2 md:px-3 py-1 text-xs font-body font-medium rounded ${
                          user.isActive !== false
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {user.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 border border-black/10 bg-white">
              <p className="font-body text-sm text-black/60">No users registered yet</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
