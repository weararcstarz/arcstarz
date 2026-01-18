'use client';

import { useState, useEffect } from 'react';

export default function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Check if user has already subscribed on component mount
  useEffect(() => {
    const hasSubscribed = localStorage.getItem('arcstarz_newsletter_subscribed');
    const savedEmail = localStorage.getItem('arcstarz_newsletter_email');
    
    if (hasSubscribed === 'true' && savedEmail) {
      setSubmitSuccess(true);
      setEmail(savedEmail);
    } else if (savedEmail) {
      // If email is saved but not subscribed, restore the email
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        // Save subscription state to localStorage
        localStorage.setItem('arcstarz_newsletter_subscribed', 'true');
        localStorage.setItem('arcstarz_newsletter_email', email);
        
        // Show success notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
              message: 'Welcome to the Inner Circle! Check your email for confirmation.',
              type: 'success'
            }
          }));
        }
        
        setEmail('');
      } else {
        setMessage(data.message || 'Failed to subscribe');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setMessage('Failed to subscribe. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border-4 border-black p-6 md:p-8 max-w-xl mx-auto">
      <h3 className="font-headline text-lg md:text-xl tracking-tight mb-4 text-black uppercase">
        {submitSuccess ? 'YOU\'RE ON THE LIST' : 'Join the Inner Circle'}
      </h3>
      <p className="font-body text-xs md:text-sm text-black/70 mb-6">
        {submitSuccess 
          ? 'You\'ll be the first to know when we drop. Stay active.'
          : 'Get exclusive access to limited drops, early releases, and cultural insider content.'
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
              setEmail('');
            }}
            className="inline-block border-2 border-black bg-transparent px-6 py-2 font-body text-xs tracking-wide hover:bg-black hover:text-white transition-colors"
          >
            Not you? Reset
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-white border-2 border-black px-4 py-3 font-body text-sm tracking-wide placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-white text-black border-2 border-black px-6 py-3 font-body text-sm tracking-wide hover:bg-black hover:text-white transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
            >
              {isLoading ? 'Sending...' : 'Notify'}
            </button>
          </div>
        </form>
      )}
      
      <div className="mt-6 pt-6 border-t-2 border-black">
        <p className="font-body text-xs text-black/50 text-center">
          By subscribing, you agree to receive exclusive ARCSTARZ content.
          <br />
          Unsubscribe anytime at <a href={`${API_URL}/api/unsubscribe?email=${email}`} className="text-black underline hover:text-black/70 transition-colors">arcstarz.com/unsubscribe</a>
        </p>
      </div>
    </div>
  );
}
