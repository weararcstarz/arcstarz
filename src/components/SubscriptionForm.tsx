'use client';

import { useState, useEffect } from 'react';

export default function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState('');

  // Check subscription status on component mount
  useEffect(() => {
    const savedSubscription = localStorage.getItem('arcstarz_subscription');
    if (savedSubscription) {
      try {
        const subscription = JSON.parse(savedSubscription);
        setIsSubscribed(true);
        setSubscribedEmail(subscription.email);
      } catch (error) {
        console.error('Error parsing saved subscription:', error);
        localStorage.removeItem('arcstarz_subscription');
      }
    }
  }, []);

  // Save subscription state to localStorage
  const saveSubscriptionState = (email: string) => {
    const subscriptionData = {
      email: email,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('arcstarz_subscription', JSON.stringify(subscriptionData));
  };

  // Clear subscription state from localStorage
  const clearSubscriptionState = () => {
    localStorage.removeItem('arcstarz_subscription');
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        setIsSubscribed(true);
        setSubscribedEmail(email);
        setEmail(''); // Clear form on success
        saveSubscriptionState(email); // Save to localStorage
      } else {
        setMessage(data.message || 'Subscription failed');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscribedEmail) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/unsubscribe?email=${encodeURIComponent(subscribedEmail)}`);
      const data = await response.json();

      if (data.success) {
        setMessage('You have been successfully unsubscribed.');
        setMessageType('success');
        setIsSubscribed(false);
        setSubscribedEmail('');
        clearSubscriptionState(); // Clear from localStorage
      } else {
        setMessage(data.message || 'Unsubscribe failed');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeAgain = () => {
    setIsSubscribed(false);
    setSubscribedEmail('');
    setMessage('');
    setMessageType('');
    clearSubscriptionState(); // Clear from localStorage
  };

  // Original UI design - not subscribed state
  if (!isSubscribed) {
    return (
      <div className="text-center">
        <h2 className="font-headline text-lg sm:text-xl md:text-2xl tracking-tight mb-4 sm:mb-6 md:mb-8 border-b-4 border-[#0A0A0A] pb-2 sm:pb-4">
          JOIN THE INNER CIRCLE
        </h2>
        <form onSubmit={handleSubscribe} className="space-y-3 sm:space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ENTER EMAIL"
            className="input-minimal w-full text-sm sm:text-base"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full hover-lift text-sm sm:text-base py-2 sm:py-3"
          >
            {isLoading ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
          </button>
        </form>
        {message && (
          <div className={`mt-3 sm:mt-4 text-center font-body text-xs px-4 ${
            messageType === 'success' 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {message}
          </div>
        )}
        <p className="font-body text-xs mt-3 sm:mt-4 text-[#1C1C1C] px-4">
          EXCLUSIVE DROPS • EARLY ACCESS • CULTURAL INSIDER
        </p>
      </div>
    );
  }

  // Subscribed state - show unsubscribe option
  return (
    <div className="text-center">
      <h2 className="font-headline text-lg sm:text-xl md:text-2xl tracking-tight mb-4 sm:mb-6 md:mb-8 border-b-4 border-[#0A0A0A] pb-2 sm:pb-4">
        WELCOME TO THE INNER CIRCLE
      </h2>
      
      <div className="space-y-6">
        {/* Subscription Status */}
        <div className="bg-white border-2 border-[#0A0A0A] p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-body text-sm text-[#0A0A0A] font-semibold">
                ACTIVE SUBSCRIPTION
              </span>
            </div>
            <div className="font-body text-sm text-[#1C1C1C]">
              <p className="font-semibold text-lg">{subscribedEmail}</p>
              <p className="text-xs mt-1 text-[#666]">Subscribed to ARCSTARZ Inner Circle</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="w-full btn-primary hover-lift text-sm sm:text-base py-2 sm:py-3 bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'PROCESSING...' : 'UNSUBSCRIBE'}
          </button>
          
          <button
            onClick={handleSubscribeAgain}
            className="w-full font-body text-xs text-[#666] hover:text-[#0A0A0A] transition-colors py-2"
          >
            ← Subscribe with different email
          </button>
        </div>

        {/* Benefits Reminder */}
        <div className="bg-[#F5F5F0] border border-[#0A0A0A] p-4">
          <p className="font-body text-xs text-[#1C1C1C] leading-relaxed">
            <span className="font-semibold">Your Benefits:</span><br/>
            Exclusive drops • Early access • Cultural insider
          </p>
        </div>
      </div>
      
      {message && (
        <div className={`mt-4 p-3 text-center font-body text-xs ${
          messageType === 'success' 
            ? 'text-green-600 bg-green-50 border border-green-200' 
            : 'text-red-600 bg-red-50 border border-red-200'
        }`}>
          {message}
        </div>
      )}
      
      <p className="font-body text-xs mt-6 text-[#1C1C1C] px-4">
        EXCLUSIVE DROPS • EARLY ACCESS • CULTURAL INSIDER
      </p>
    </div>
  );
}
