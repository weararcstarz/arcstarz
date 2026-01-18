'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || '1767942289962';
  const isOwner = user?.id === OWNER_ID;

  return (
    <footer className="bg-[#0A0A0A] text-[#F5F5F0] border-t-4 border-[#F5F5F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/logos/arcstarzlogo.png" 
                alt="ARCSTARZ" 
                className="h-10 w-auto object-contain brightness-0 invert"
              />
              <h3 className="font-headline text-2xl tracking-tight">ARCSTARZ</h3>
            </div>
            <p className="font-body text-sm mb-4 text-[#BFBFBF]">
              Luxury streetwear with uncompromising quality. Limited edition drops for those who demand excellence.
            </p>
            <div className="space-y-2">
              <p className="font-body text-xs text-[#BFBFBF]">
                © 2026 ARCSTARZ. All rights reserved.
              </p>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-headline text-sm tracking-tight uppercase mb-4">SHOP</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/shop" 
                  className="font-body text-sm text-[#BFBFBF] hover:text-[#F5F5F0] transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link 
                  href="/currency-rates" 
                  className="font-body text-sm text-[#BFBFBF] hover:text-[#F5F5F0] transition-colors"
                >
                  Currency Rates
                </Link>
              </li>
              <li>
                <Link 
                  href="/account" 
                  className="font-body text-sm text-[#BFBFBF] hover:text-[#F5F5F0] transition-colors"
                >
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-headline text-sm tracking-tight uppercase mb-4">LEGAL</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/terms" 
                  className="font-body text-sm text-[#BFBFBF] hover:text-[#F5F5F0] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="font-body text-sm text-[#BFBFBF] hover:text-[#F5F5F0] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/login" 
                  className="font-body text-sm text-[#BFBFBF] hover:text-[#F5F5F0] transition-colors"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Hidden Admin Access - Only visible to owner */}
        {isOwner && (
          <div className="border-t border-[#1C1C1C] pt-4 mb-4">
            <div className="flex justify-center space-x-4">
              <Link 
                href="/admin/orders"
                className="px-4 py-2 bg-[#1C1C1C] text-[#F5F5F0] font-body text-xs font-semibold hover:bg-[#2C2C2C] transition-all rounded border border-[#333333]"
              >
                🛡️ ORDERS DASHBOARD
              </Link>
              <Link 
                href="/admin/users"
                className="px-4 py-2 bg-[#1C1C1C] text-[#F5F5F0] font-body text-xs font-semibold hover:bg-[#2C2C2C] transition-all rounded border border-[#333333]"
              >
                👥 USERS DASHBOARD
              </Link>
              <Link 
                href="/admin/email"
                className="px-4 py-2 bg-[#1C1C1C] text-[#F5F5F0] font-body text-xs font-semibold hover:bg-[#2C2C2C] transition-all rounded border border-[#333333]"
              >
                📧 EMAIL MANAGER
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="border-t border-[#1C1C1C] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Payment Methods */}
            <div className="flex items-center space-x-4">
              <span className="font-body text-xs text-[#BFBFBF]">ACCEPTED PAYMENTS:</span>
              <div className="flex space-x-2">
                {/* Visa */}
                <div className="w-12 h-7 bg-[#1A1F71] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">VISA</span>
                </div>
                
                {/* Mastercard */}
                <div className="w-12 h-7 bg-[#EB001B] rounded flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#F79E1B] rounded-full"></div>
                    <div className="w-2 h-2 bg-[#EB001B] rounded-full"></div>
                  </div>
                </div>
                
                {/* Stripe */}
                <div className="w-12 h-7 bg-[#635BFF] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Stripe</span>
                </div>
                
                {/* PayPal */}
                <div className="w-12 h-7 bg-[#003087] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">PayPal</span>
                </div>
                
                {/* M-Pesa */}
                <div className="w-12 h-7 bg-[#00B140] rounded flex items-center justify-center">
                  <div className="flex items-center">
                    <span className="text-white font-bold text-[7px] tracking-tight">M</span>
                    <span className="text-white font-bold text-[7px]">-</span>
                    <span className="text-white font-bold text-[7px] tracking-tight">PESA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="font-body text-xs text-[#BFBFBF]">FOLLOW US:</span>
              <div className="flex space-x-3">
                {/* Instagram */}
                <a 
                  href="https://instagram.com/arcstarzke" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="Instagram"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <rect x="2" y="2" width="20" height="20" rx="4" stroke="white" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="white"/>
                  </svg>
                </a>
                
                {/* TikTok */}
                <a 
                  href="https://tiktok.com/@arcstarzke" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-black rounded flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label="TikTok"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 11-2.88-2.89h-.19V9.17a6.34 6.34 0 106.34 6.34V11.2a4.83 4.83 0 003.77-4.51z"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}
