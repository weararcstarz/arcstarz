'use client';

import { useState } from 'react';
import { CartItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { usePerfectCurrency } from '@/contexts/PerfectCurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
}

export default function CartDrawer({ isOpen, onClose, items, total }: CartDrawerProps) {
  const { formatPrice } = usePerfectCurrency();
  const { removeFromCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleRemoveItem = (item: CartItem) => {
    removeFromCart(item.id, item.selectedSize);
  };

  const handleCheckout = () => {
    if (!user) {
      // Redirect to login page
      router.push('/login');
      onClose();
      return;
    }
    // User is logged in, proceed to shipping
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`cart-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-black/10 bg-white">
            <h2 className="font-headline text-base sm:text-lg tracking-tight text-black">CART</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-black/5 transition-all rounded"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-white">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="font-body text-sm text-black/60 mb-2">YOUR CART IS EMPTY</p>
                <p className="font-body text-xs text-black/40">Add items to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={`${item.id}-${item.selectedSize}-${index}`} className="flex gap-3 pb-4 border-b border-black/5">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-body text-xs sm:text-sm tracking-tight mb-1 text-black truncate">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs font-body text-black/60">
                          <span>Size {item.selectedSize}</span>
                          <span>×{item.quantity}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <p className="font-body text-sm sm:text-base font-medium text-black">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => handleRemoveItem(item)}
                          className="p-1.5 hover:bg-black/5 transition-all rounded"
                          aria-label="Remove item"
                        >
                          <svg className="w-4 h-4 text-black/40 hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-black/10 px-4 sm:px-6 py-4 bg-white">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-body text-base sm:text-lg font-medium text-black">Total</span>
                  <span className="font-headline text-lg sm:text-xl tracking-tight text-black">{formatPrice(total)}</span>
                </div>
              </div>
              
              <Link href={user ? "/shipping" : "/login"} onClick={handleCheckout}>
                <button className="w-full bg-black text-white px-6 py-3 text-sm font-body font-medium hover:bg-gray-800 transition-all">
                  CHECKOUT
                </button>
              </Link>
              
              <button
                onClick={onClose}
                className="w-full mt-2 px-6 py-3 border border-black/20 bg-white text-black font-body text-sm font-medium hover:bg-black/5 transition-all"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
