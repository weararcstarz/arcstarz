'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { usePerfectCurrency } from '@/contexts/PerfectCurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShippingDetails } from '@/types/common';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { formatPrice } = usePerfectCurrency();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState<'stripe' | 'paypal'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug: Log cart items
  console.log('Checkout cart items:', cartItems);

  // Check if user is logged in and redirect if not
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Get user email for order processing
  const userEmail = user?.email;
  const userName = user?.name;

  // Shipping details state
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails | null>(null);

  // Load shipping details from localStorage
  useEffect(() => {
    if (!user) return; // Don't proceed if user is not logged in
    
    const savedShipping = localStorage.getItem('arcstarz_shipping_details');
    if (savedShipping) {
      try {
        const parsed = JSON.parse(savedShipping);
        setShippingDetails(parsed);
      } catch (error) {
        console.error('Error loading shipping details:', error);
        // Redirect to shipping page if no details found
        router.push('/shipping');
      }
    } else {
      // Redirect to shipping page if no details found
      router.push('/shipping');
    }
  }, [router, user]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F0]">
        <Navbar />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-headline text-4xl tracking-tight mb-8">YOUR CART IS EMPTY</h1>
            <Link href="/shop">
              <button className="btn-primary hover-lift">
                CONTINUE SHOPPING
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    try {
      console.log('Starting Stripe checkout with items:', cartItems);
      
      // Proceed with Stripe checkout FIRST (no order creation yet)
      if (process.env.NODE_ENV === 'development') {
        console.log('User email:', userEmail);
        console.log('Shipping details:', shippingDetails);
      }
      
      // Call Stripe Checkout API route
      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          total: cartTotal,
          customerEmail: userEmail,
          customerName: userName,
          shippingDetails: shippingDetails,
        }),
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.details || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      console.log('Received checkout URL:', url);
      
      // Redirect to Stripe Checkout URL
      if (url) {
        window.location.href = url;
      } else {
        console.error('No checkout URL received');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
    }
  };

  const handlePayPalCheckout = async () => {
    setIsProcessing(true);
    try {
      console.log('Starting PayPal checkout with items:', cartItems);
      if (process.env.NODE_ENV === 'development') {
        console.log('User email:', userEmail);
        console.log('Shipping details:', shippingDetails);
      }
      
      // Call PayPal Checkout API route
      const response = await fetch('/api/checkout/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          total: cartTotal,
          customerEmail: userEmail,
          customerName: userName,
          shippingDetails: shippingDetails,
        }),
      });

      console.log('PayPal API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal API error response:', errorData);
        throw new Error(errorData.details || 'Failed to create PayPal checkout session');
      }

      const { approvalUrl } = await response.json();
      console.log('Received PayPal approval URL:', approvalUrl);
      
      // Redirect to PayPal approval URL
      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        console.error('No PayPal approval URL received');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('PayPal checkout error:', error);
      setIsProcessing(false);
    }
  };

  const handleCheckout = () => {
    switch (selectedPayment) {
      case 'stripe':
        handleStripeCheckout();
        break;
      case 'paypal':
        handlePayPalCheckout();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="flex justify-center mb-4">
              <img 
                src="/logos/arcstarzlogo.png" 
                alt="ARCSTARZ" 
                className="h-12 md:h-16 w-auto object-contain"
              />
            </div>
            <h1 className="font-headline text-2xl md:text-4xl tracking-tight mb-2 md:mb-4 text-black">
              CHECKOUT
            </h1>
            <p className="font-body text-xs md:text-sm tracking-wide text-black/60">
              Secure payment
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-white border border-black/10 p-4 md:p-6">
                <h2 className="font-body text-sm md:text-base tracking-tight mb-4 md:mb-6 text-black font-medium">ORDER SUMMARY</h2>
                
                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                  {cartItems.map((item, index) => (
                    <div key={`${item.id}-${item.selectedSize}-${index}`} className="flex gap-3 pb-3 md:pb-4 border-b border-black/5">
                      <div className="relative w-12 h-12 md:w-16 md:h-16 bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain"
                          onError={(e) => {
                            console.error('Image failed to load in checkout:', item.image, e);
                            e.currentTarget.src = '/products/slytherinetee-black.png';
                          }}
                          onLoad={() => console.log('Image loaded in checkout:', item.image)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body text-xs md:text-sm tracking-tight text-black truncate">
                          {item.name}
                        </h3>
                        <p className="font-body text-xs text-black/60">
                          Size {item.selectedSize} × {item.quantity}
                        </p>
                        <p className="font-body text-xs md:text-sm mt-1 font-medium text-black">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-black/10">
                  <div className="flex justify-between font-body text-xs md:text-sm text-black/60">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between font-body text-xs md:text-sm text-black/60">
                    <span>Shipping</span>
                    <span>FREE</span>
                  </div>
                  <div className="flex justify-between font-body text-sm md:text-lg font-medium pt-2 border-t border-black/10 text-black">
                    <span>Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-6">
              <div className="bg-white border border-black/10 p-4 md:p-6">
                <h2 className="font-body text-sm md:text-base tracking-tight mb-4 md:mb-6 text-black font-medium">PAYMENT METHOD</h2>
                
                <div className="space-y-3 md:space-y-4">
                  {/* Stripe Option */}
                  <button
                    onClick={() => setSelectedPayment('stripe')}
                    className={`w-full p-3 md:p-4 border transition-all ${
                      selectedPayment === 'stripe'
                        ? 'border-black bg-black text-white'
                        : 'border-black/20 bg-white text-black hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <img 
                          src="/logos/visa.png" 
                          alt="Visa" 
                          className="h-4 md:h-5 w-auto object-contain"
                        />
                        <span className="font-body text-xs md:text-sm font-medium">Credit/Debit Card</span>
                      </div>
                      <span className="font-body text-xs text-current opacity-60">Stripe</span>
                    </div>
                  </button>

                  {/* PayPal Option */}
                  <button
                    onClick={() => setSelectedPayment('paypal')}
                    className={`w-full p-3 md:p-4 border transition-all ${
                      selectedPayment === 'paypal'
                        ? 'border-black bg-black text-white'
                        : 'border-black/20 bg-white text-black hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <img 
                          src="/logos/paypal.png" 
                          alt="PayPal" 
                          className="h-5 md:h-6 w-auto object-contain"
                        />
                        <span className="font-body text-xs md:text-sm font-medium">PayPal</span>
                      </div>
                      <span className="font-body text-xs text-current opacity-60">PayPal</span>
                    </div>
                  </button>

                  {/* M-Pesa Option - Coming Soon */}
                  <button
                    disabled={true}
                    className="w-full p-3 md:p-4 border border-black/10 bg-gray-50 text-black/40 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <img 
                          src="/logos/mpesa.png" 
                          alt="M-Pesa" 
                          className="h-5 md:h-6 w-auto object-contain opacity-40"
                        />
                        <span className="font-body text-xs md:text-sm font-medium">M-Pesa</span>
                      </div>
                      <span className="font-body text-xs">Coming Soon</span>
                    </div>
                  </button>
                </div>

                <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-black text-white px-6 py-3 md:py-4 text-sm font-body font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'PROCESSING...' : `COMPLETE ORDER • ${formatPrice(cartTotal)}`}
                  </button>
                  
                  <Link href="/shop">
                    <button className="w-full px-6 py-3 md:py-4 border border-black/20 bg-white text-black font-body text-sm font-medium hover:bg-black/5 transition-all">
                      CONTINUE SHOPPING
                    </button>
                  </Link>
                </div>
              </div>

              {/* Security Notice */}
              <div className="text-center">
                <p className="font-body text-xs text-black/60">
                  🔒 Secure encrypted payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
