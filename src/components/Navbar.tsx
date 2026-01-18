'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import CurrencySelector from '@/components/CurrencySelector';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems, cartCount, setIsCartOpen } = useCart();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F0] border-b-4 border-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src="/logos/arcstarzlogo.png" 
              alt="ARCSTARZ" 
              className="h-12 w-auto object-contain"
            />
            <span className="font-headline text-2xl tracking-tight hidden sm:block">
              ARCSTARZ
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <CurrencySelector />
            
            <Link 
              href="/shop" 
              className="font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold border-b-2 border-transparent hover:border-[#0A0A0A] pb-1"
            >
              Shop
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/account"
                  className="font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold border-b-2 border-transparent hover:border-[#0A0A0A] pb-1"
                >
                  Account
                </Link>
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold border-b-2 border-transparent hover:border-[#0A0A0A] pb-1"
                >
                  Cart ({cartCount})
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold border-b-2 border-transparent hover:border-[#0A0A0A] pb-1"
                >
                  Login
                </Link>
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold border-b-2 border-transparent hover:border-[#0A0A0A] pb-1"
                >
                  Cart ({cartCount})
                </button>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          {isMounted && (
            <div className="flex md:hidden items-center gap-4">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2"
                aria-label="Cart"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2"
                aria-label="Menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <line x1="3" y1="12" x2="21" y2="12"/>
                      <line x1="3" y1="18" x2="21" y2="18"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#F5F5F0] border-t-2 border-[#0A0A0A]">
          <div className="px-4 py-6 space-y-4">
            <div className="pb-4 border-b-2 border-[#0A0A0A]">
              <CurrencySelector />
            </div>
            
            <Link 
              href="/shop" 
              onClick={() => setIsMenuOpen(false)}
              className="block font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold py-2"
            >
              Shop
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="block font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold py-2"
                >
                  Account
                </Link>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="block w-full text-left font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold py-2"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
