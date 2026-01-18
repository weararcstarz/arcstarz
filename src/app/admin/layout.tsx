'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import AdminProtection from '@/components/AdminProtection';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Orders', href: '/admin/orders', icon: '📦' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Notify Users', href: '/admin/notify-users', icon: '🔔' },
    { name: 'Email', href: '/admin/email', icon: '📧' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <AdminProtection>
      <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden border-b-4 border-black bg-black">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <Image 
                src="/logos/arcstarzlogo.png" 
                alt="ARCSTARZ" 
                width={32} 
                height={32}
                className="object-contain"
              />
              <span className="font-headline text-white uppercase tracking-wider">Admin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-black transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="hidden lg:flex items-center space-x-3 p-6 border-b-2 border-white/20">
              <Image 
                src="/logos/arcstarzlogo.png" 
                alt="ARCSTARZ" 
                width={40} 
                height={40}
                className="object-contain"
              />
              <h1 className="font-headline text-xl text-white uppercase tracking-wider">
                Admin Panel
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg font-body text-sm uppercase tracking-wider transition-colors
                    ${isActive(item.href) 
                      ? 'bg-white text-black' 
                      : 'text-white hover:bg-white/10'
                    }
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t-2 border-white/20">
              <div className="text-white/80 text-xs font-body uppercase tracking-wider">
                Admin: {user?.email}
              </div>
              <div className="text-white/60 text-xs font-body mt-1">
                {user?.email === 'bashirali652@icloud.com' ? '👑 Owner' : user?.role === 'admin' ? '🔧 Admin' : '👤 User'}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Desktop Header */}
          <div className="hidden lg:block border-b-4 border-black bg-black">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="font-headline text-xl text-white uppercase tracking-wider">
                  Admin Dashboard
                </h1>
                <div className="text-right">
                  <div className="text-white/80 text-sm font-body">
                    {user?.email}
                  </div>
                  <div className="text-white/60 text-xs font-body">
                    {user?.email === 'bashirali652@icloud.com' ? '👑 Owner' : user?.role === 'admin' ? '🔧 Admin' : '👤 User'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
    </AdminProtection>
  );
}
