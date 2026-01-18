'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterCredentials } from '@/types/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();
    
    try {
      await register(credentials);
      // Registration handles its own redirect to /shop
      console.log('Registration successful, redirect handled by AuthContext');
    } catch (error) {
      // Error is handled by auth context
      console.error('Registration form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    clearError();
    
    try {
      await loginWithGoogle();
      // Google login handles its own redirect to /shop
      console.log('Google login successful, redirect handled by AuthContext');
    } catch (error) {
      // Error is handled by auth context
      console.error('Google login form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img 
              src="/logos/arcstarzlogo.png" 
              alt="ARCSTARZ" 
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
          <h1 className="font-headline text-3xl tracking-tight mb-4">
            ARCSTARZ
          </h1>
          <p className="font-subtitle tracking-wider text-[#1C1C1C]">
            FAITH IN MOTION
          </p>
        </div>

        {/* Register Form */}
        <div className="border-4 border-[#0A0A0A] bg-[#F5F5F0] p-8">
          <h2 className="font-headline text-2xl tracking-tight mb-8 text-center">
            JOIN THE INNER CIRCLE
          </h2>

          {error && (
            <div className="mb-6 p-4 border-2 border-red-600 bg-red-50">
              <p className="font-body text-sm text-red-600 font-semibold">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="font-subtitle tracking-wider text-sm block mb-2">
                NAME
              </label>
              <input
                type="text"
                name="name"
                value={credentials.name}
                onChange={handleChange}
                required
                className="input-minimal w-full"
                placeholder="ENTER YOUR NAME"
              />
            </div>

            <div>
              <label className="font-subtitle tracking-wider text-sm block mb-2">
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="input-minimal w-full"
                placeholder="ENTER YOUR EMAIL"
              />
            </div>

            <div>
              <label className="font-subtitle tracking-wider text-sm block mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                minLength={6}
                className="input-minimal w-full"
                placeholder="CREATE PASSWORD (MIN 6 CHARS)"
              />
            </div>

            <div>
              <label className="font-subtitle tracking-wider text-sm block mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={credentials.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="input-minimal w-full"
                placeholder="CONFIRM PASSWORD"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="btn-primary w-full hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
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
              disabled={isLoading || isSubmitting}
              className="w-full border-2 border-[#0A0A0A] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-3 py-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-body text-sm font-semibold text-[#0A0A0A]">
                CONTINUE WITH GOOGLE
              </span>
            </button>
          </form>

          {/* Benefits */}
          <div className="mt-8 space-y-2">
            <p className="font-subtitle text-xs tracking-wider text-[#1C1C1C]">
              MEMBER BENEFITS:
            </p>
            <ul className="font-body text-xs text-[#1C1C1C] space-y-1">
              <li>• Early access to drops</li>
              <li>• Exclusive member pricing</li>
              <li>• Priority customer support</li>
              <li>• Limited edition releases</li>
            </ul>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="font-body text-sm text-[#1C1C1C] mb-4">
            ALREADY A MEMBER?
          </p>
          <Link 
            href="/login"
            className="font-headline text-sm tracking-tight border-b-4 border-[#0A0A0A] pb-1 hover:border-[#BFBFBF] transition-colors"
          >
            SIGN IN
          </Link>
        </div>

        {/* Back to Shop */}
        <div className="text-center mt-8">
          <Link 
            href="/"
            className="font-body text-sm text-[#1C1C1C] hover:text-[#0A0A0A] transition-colors"
          >
            ← BACK TO SHOP
          </Link>
        </div>
      </div>
    </div>
  );
}
