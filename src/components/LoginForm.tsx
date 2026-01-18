'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  
  const { login, loginWithGoogle, isLoading, error, clearError, user } = useAuth();
  const router = useRouter();

  // Handle redirect after successful login
  useEffect(() => {
    if (user) {
      console.log('User logged in, redirecting...');
      // Check if user is admin/owner, redirect to admin, otherwise to shop
      if (user.role === 'admin' || user.isOwner) {
        router.push('/admin');
      } else {
        router.push('/shop');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();
    
    // Basic validation
    if (!credentials.email || !credentials.password) {
      setFormError('Please fill in all fields');
      return;
    }
    
    if (!credentials.email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    try {
      await login(credentials);
      // Navigation is handled by AuthContext
      console.log('Login successful, navigation handled by AuthContext');
    } catch (error) {
      console.error('Login submission error:', error);
      setFormError('Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    setFormError('');
    clearError();
    
    console.log('Starting Google login...');
    // Call Google login - this will redirect immediately
    loginWithGoogle();
    
    // The redirect happens immediately, so we don't need to handle the response here
    // If the user comes back to this page, the useEffect in AuthContext will handle the callback
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    setFormError('');
    if (error) clearError();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="flex justify-center mb-4">
            <img 
              src="/logos/arcstarzlogo.png" 
              alt="ARCSTARZ" 
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
          <h1 className="font-headline text-xl sm:text-2xl lg:text-3xl tracking-tight mb-2 sm:mb-4">
            ARCSTARZ
          </h1>
          <p className="font-subtitle tracking-wider text-[#1C1C1C] text-xs sm:text-sm">
            FAITH IN MOTION
          </p>
        </div>

        {/* Login Form */}
        <div className="border-4 border-[#0A0A0A] bg-[#F5F5F0] p-6 sm:p-8">
          <h2 className="font-headline text-xl sm:text-2xl tracking-tight mb-4 text-center">
            MEMBER ACCESS
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#1C1C1C] text-center mb-6 sm:mb-8">
            Login to add items to cart and checkout
          </p>

          {(error || formError) && (
            <div className="mb-6 p-4 border-2 border-red-600 bg-red-50">
              <p className="font-body text-sm text-red-600 font-semibold">
                {error || formError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="font-subtitle tracking-wider text-xs sm:text-sm block mb-2">
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="input-minimal w-full text-sm sm:text-base"
                placeholder="ENTER YOUR EMAIL"
              />
            </div>

            <div>
              <label className="font-subtitle tracking-wider text-xs sm:text-sm block mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="input-minimal w-full text-sm sm:text-base"
                placeholder="ENTER YOUR PASSWORD"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full hover-lift disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-3 sm:py-4"
            >
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#BFBFBF]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#F5F5F0] font-body text-xs text-[#1C1C1C]">OR</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full border-2 border-[#0A0A0A] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 py-3 sm:py-4 min-h-[48px] sm:min-h-[52px]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-body text-sm sm:text-base font-semibold text-[#0A0A0A] whitespace-nowrap">
                {isLoading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}
              </span>
            </button>
          </form>

        </div>

        {/* Register Link */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="font-body text-xs sm:text-sm text-[#1C1C1C] mb-4">
            NOT A MEMBER YET?
          </p>
          <Link 
            href="/register"
            className="font-headline text-xs sm:text-sm tracking-tight border-b-4 border-[#0A0A0A] pb-1 hover:border-[#BFBFBF] transition-colors"
          >
            CREATE ACCOUNT
          </Link>
        </div>

        {/* Back to Shop */}
        <div className="text-center mt-6 sm:mt-8">
          <Link 
            href="/"
            className="font-body text-xs sm:text-sm text-[#1C1C1C] hover:text-[#0A0A0A] transition-colors"
          >
            ← BACK TO SHOP
          </Link>
        </div>
      </div>
    </div>
  );
}
