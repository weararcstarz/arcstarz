'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import CurrencySelector from '@/components/CurrencySelector';
import { products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { trackSearch, trackCategoryFilter, trackProductView } from '@/services/connectedSystem';

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { cartItems, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const API_URL = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';

  // Check if user has already subscribed on component mount
  useEffect(() => {
    const hasSubscribed = localStorage.getItem('arcstarz_newsletter_subscribed');
    const savedEmail = localStorage.getItem('arcstarz_newsletter_email');
    
    if (hasSubscribed === 'true' && savedEmail) {
      setSubmitSuccess(true);
      setNotifyEmail(savedEmail);
    } else if (savedEmail) {
      // If email is saved but not subscribed, restore the email
      setNotifyEmail(savedEmail);
    }
  }, []);

  const categories = ['all', 'tops', 'bottoms', 'accessories'];
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const searchFilteredProducts = searchQuery
    ? filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredProducts;

  // Track search queries
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 2) {
      trackSearch(value, user?.id);
    }
  };

  // Track category filters
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category !== 'all') {
      trackCategoryFilter(category, user?.id);
    }
    setIsFilterModalOpen(false);
  };

  // Handle notify me submission
  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notifyEmail) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: notifyEmail }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitSuccess(true);
        // Save subscription state to localStorage
        localStorage.setItem('arcstarz_newsletter_subscribed', 'true');
        localStorage.setItem('arcstarz_newsletter_email', notifyEmail);
        
        // Show success notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
              message: 'Welcome to the Inner Circle! Check your email for confirmation.',
              type: 'success'
            }
          }));
        }
      } else {
        // Handle error case
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
              message: data.message || 'Subscription failed. Please try again.',
              type: 'error'
            }
          }));
        }
      }
    } catch (error) {
      console.error('Notify me error:', error);
      // Show error notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            message: 'Network error. Please check your connection and try again.',
            type: 'error'
          }
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        total={cartTotal}
      />

      {/* Unified Header for Mobile and Desktop */}
      <div className="pt-24 md:pt-32 pb-4 md:pb-8 px-4 md:px-6 bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-headline text-xl md:text-4xl tracking-tight text-black">
                  SHOP
                </h1>
                <p className="font-body text-xs md:text-sm text-black/60 mt-1">
                  {searchFilteredProducts.length} Products Available
                </p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="w-full">
              <input
                type="text"
                placeholder="Search products (coming soon)..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full md:w-80 bg-gray-50 border border-black/10 text-black placeholder-gray-400 px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Unified Category Filter for Mobile and Desktop */}
      <div className="px-4 md:px-6 py-3 md:py-4 bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-medium uppercase tracking-wide whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-black/20 hover:bg-black hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dropping Soon Section */}
      <div className="px-4 md:px-6 py-12 md:py-20 pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6 md:space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-6 md:mb-8">
              <img 
                src="/logos/arcstarzlogo.png" 
                alt="ARCSTARZ" 
                className="h-24 md:h-32 w-auto object-contain animate-pulse"
              />
            </div>

            {/* Main Message */}
            <div className="space-y-4">
              <h2 className="font-headline text-3xl md:text-5xl lg:text-6xl tracking-tight text-black uppercase">
                DROPPING SOON
              </h2>
              <div className="w-24 md:w-32 h-1 bg-black mx-auto"></div>
              <p className="font-headline text-xl md:text-3xl tracking-tight text-black uppercase">
                STAY ACTIVE
              </p>
            </div>

            {/* Description */}
            <div className="max-w-2xl mx-auto space-y-4 pt-4 md:pt-6">
              <p className="font-body text-sm md:text-base text-black/80 leading-relaxed">
                Luxury streetwear with uncompromising quality. Limited edition drops for those who demand excellence.
              </p>
              <p className="font-subtitle text-xs md:text-sm text-black/60 tracking-wider">
                FAITH IN MOTION
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="pt-8 md:pt-12">
              <div className="bg-white border-4 border-black p-6 md:p-8 max-w-xl mx-auto">
                <h3 className="font-headline text-lg md:text-xl tracking-tight mb-4 text-black uppercase">
                  {submitSuccess ? 'YOU\'RE ON THE LIST' : 'Get Notified'}
                </h3>
                <p className="font-body text-xs md:text-sm text-black/70 mb-6">
                  {submitSuccess 
                    ? 'You\'ll be the first to know when we drop. Stay active.'
                    : 'Join the inner circle. Be the first to know when we drop.'
                  }
                </p>
                
                {submitSuccess ? (
                  <div className="text-center space-y-4">
                    <div className="border-4 border-black bg-white p-6">
                      <div className="space-y-3">
                        <h4 className="font-headline text-lg tracking-tight uppercase text-black">
                          YOU'RE ON THE LIST
                        </h4>
                        <p className="font-body text-sm text-black/80 leading-relaxed">
                          Welcome to the Inner Circle. Check your email for confirmation.
                        </p>
                        <p className="font-subtitle text-xs text-black/60 tracking-wider">
                          STAY ACTIVE
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSubmitSuccess(false);
                        localStorage.removeItem('arcstarz_newsletter_subscribed');
                        localStorage.removeItem('arcstarz_newsletter_email');
                        setNotifyEmail('');
                      }}
                      className="inline-block border-2 border-black bg-transparent px-6 py-2 font-body text-xs tracking-wide hover:bg-black hover:text-white transition-colors"
                    >
                      Not you? Reset
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleNotifyMe} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="flex-1 bg-white border-2 border-black px-4 py-3 font-body text-sm tracking-wide placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                      />
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-white text-black border-2 border-black px-6 py-3 font-body text-sm tracking-wide hover:bg-black hover:text-white transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
                      >
                        {isSubmitting ? 'Sending...' : 'Notify'}
                      </button>
                    </div>
                  </form>
                )}
                
                              </div>
            </div>

            {/* Social Proof */}
            <div className="pt-8 md:pt-12 space-y-3">
              <p className="font-body text-xs md:text-sm text-black/50 uppercase tracking-wider">
                Follow the movement
              </p>
              <div className="flex justify-center gap-6">
                <a href="https://www.tiktok.com/@arcstarzke" target="_blank" rel="noopener noreferrer" className="text-black hover:text-black/60 transition-colors">
                  <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-6 h-6" />
                </a>
                <a href="https://www.instagram.com/arcstarzke" target="_blank" rel="noopener noreferrer" className="text-black hover:text-black/60 transition-colors">
                  <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
