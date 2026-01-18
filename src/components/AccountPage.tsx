'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AccountPage() {
  const { user, logout } = useAuth();

  // ProtectedRoute handles authentication, so we can assume user exists
  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="border-b-4 border-[#0A0A0A] pb-8 mb-12">
          <div className="flex items-center space-x-6 mb-6">
            {user?.avatar && (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-20 h-20 rounded-full border-4 border-[#0A0A0A]"
              />
            )}
            <div>
              <h1 className="font-headline text-4xl tracking-tight mb-2">
                MY ACCOUNT
              </h1>
              <p className="font-subtitle tracking-wider text-[#1C1C1C]">
                WELCOME BACK, {user?.name?.toUpperCase() || 'MEMBER'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="border-4 border-[#0A0A0A] p-8">
            <h2 className="font-headline text-xl tracking-tight mb-6">
              ACCOUNT DETAILS
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-subtitle text-xs tracking-wider text-[#1C1C1C] mb-1">
                  NAME
                </p>
                <p className="font-body text-sm">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-subtitle text-xs tracking-wider text-[#1C1C1C] mb-1">
                  EMAIL
                </p>
                <p className="font-body text-sm">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="font-subtitle text-xs tracking-wider text-[#1C1C1C] mb-1">
                  MEMBER SINCE
                </p>
                <p className="font-body text-sm">JANUARY 2026</p>
              </div>
            </div>
          </div>

          <div className="border-4 border-[#0A0A0A] p-8">
            <h2 className="font-headline text-xl tracking-tight mb-6">
              MEMBER STATUS
            </h2>
            <div className="space-y-4">
              <div className="border-2 border-[#BFBFBF] p-4">
                <p className="font-subtitle text-xs tracking-wider text-[#1C1C1C] mb-1">
                  CURRENT TIER
                </p>
                <p className="font-headline text-lg tracking-tight">INNER CIRCLE</p>
              </div>
              <div>
                <p className="font-subtitle text-xs tracking-wider text-[#1C1C1C] mb-2">
                  BENEFITS
                </p>
                <ul className="font-body text-xs space-y-1">
                  <li>• Early access to all drops</li>
                  <li>• 10% member discount</li>
                  <li>• Free shipping on orders $100+</li>
                  <li>• Exclusive member releases</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="border-4 border-[#0A0A0A] p-8 mb-12">
          <h2 className="font-headline text-xl tracking-tight mb-6">
            RECENT ORDERS
          </h2>
          <div className="text-center py-8">
            <p className="font-body text-sm text-[#1C1C1C] mb-4">
              No orders yet
            </p>
            <Link 
              href="/shop"
              className="btn-primary hover-lift"
            >
              START SHOPPING
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={logout}
            className="btn-primary hover-lift"
          >
            SIGN OUT
          </button>
          <Link 
            href="/shop"
            className="btn-primary hover-lift bg-transparent text-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F5F5F0]"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </div>
  );
}
