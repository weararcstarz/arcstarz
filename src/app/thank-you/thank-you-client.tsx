'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

function ThankYouContent() {
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { clearCart } = useCart();

  useEffect(() => {
    const verifyPaymentAndCreateOrder = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          setError('No payment session found');
          setIsLoading(false);
          return;
        }

        console.log('🔐 Verifying payment session:', sessionId);

        // Verify payment with Stripe
        const response = await fetch('/api/checkout/stripe/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment verification failed');
        }

        const paymentData = await response.json();
        console.log('✅ Payment verified:', paymentData);

        // Create order after successful payment verification
        const orderResponse = await fetch('/api/orders/payment-verified', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerEmail: paymentData.customerEmail,
            customerName: paymentData.customerName,
            loginMethod: 'email', // Default to email for now
            userId: user?.id,
            shippingDetails: paymentData.shippingDetails,
            items: paymentData.items,
            total: paymentData.total,
            paymentProvider: 'stripe',
            transactionId: paymentData.transactionId,
            paymentMethod: 'card',
            paymentIntentId: paymentData.paymentIntentId,
          }),
        });

        if (!orderResponse.ok) {
          const orderError = await orderResponse.json();
          throw new Error(orderError.error || 'Order creation failed');
        }

        const orderData = await orderResponse.json();
        console.log('✅ Order created after payment verification:', orderData.orderNumber);

        setOrderNumber(orderData.orderNumber);
        setOrderCreated(true);
        
        // Clear cart after successful order creation
        clearCart();
        
        // Clear shipping details from localStorage
        localStorage.removeItem('arcstarz_shipping_details');
        
      } catch (err) {
        console.error('❌ Error in payment verification/order creation:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPaymentAndCreateOrder();
  }, [searchParams, user, clearCart]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0]">
        <Navbar />
        
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            {/* Loading Spinner */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto">
                <div className="w-10 h-10 border-4 border-[#F5F5F0] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>

            <h1 className="font-headline text-4xl md:text-5xl tracking-tight mb-4">
              VERIFYING PAYMENT
            </h1>
            
            <p className="font-subtitle tracking-wider text-[#1C1C1C] mb-8">
              Please wait while we confirm your payment and create your order...
            </p>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F0]">
        <Navbar />
        
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            <h1 className="font-headline text-4xl md:text-5xl tracking-tight mb-4">
              PAYMENT ERROR
            </h1>
            
            <p className="font-subtitle tracking-wider text-[#1C1C1C] mb-8">
              {error}
            </p>

            <div className="space-y-4">
              <Link href="/checkout">
                <button className="btn-primary hover-lift">
                  RETURN TO CHECKOUT
                </button>
              </Link>
              
              <Link href="/shop">
                <button className="w-full p-4 border-2 border-[#0A0A0A] bg-transparent text-[#0A0A0A] font-body text-sm font-semibold hover:bg-[#0A0A0A] hover:text-[#F5F5F0] transition-all">
                  CONTINUE SHOPPING
                </button>
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-[#0A0A0A] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-[#F5F5F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="font-headline text-4xl md:text-5xl tracking-tight mb-4">
            ORDER CONFIRMED
          </h1>
          
          <p className="font-subtitle tracking-wider text-[#1C1C1C] mb-8">
            THANK YOU FOR YOUR PURCHASE
          </p>

          {/* Order Details */}
          <div className="bg-[#0A0A0A] text-[#F5F5F0] p-8 border-4 border-[#0A0A0A] mb-8">
            <div className="space-y-4">
              <div>
                <p className="font-subtitle text-xs text-[#BFBFBF] mb-1">ORDER NUMBER</p>
                <p className="font-headline text-2xl tracking-tight">{orderNumber}</p>
              </div>
              
              <div className="pt-4 border-t border-[#F5F5F0] border-opacity-20">
                <p className="font-body text-sm mb-2">
                  A confirmation email has been sent to your registered email address.
                </p>
                <p className="font-body text-sm text-[#BFBFBF]">
                  You will receive tracking information once your order ships.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <Link href="/shop">
              <button className="btn-primary hover-lift">
                CONTINUE SHOPPING
              </button>
            </Link>
            
            <Link href="/account">
              <button className="w-full p-4 border-2 border-[#0A0A0A] bg-transparent text-[#0A0A0A] font-body text-sm font-semibold hover:bg-[#0A0A0A] hover:text-[#F5F5F0] transition-all">
                VIEW ORDER HISTORY
              </button>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-12 pt-8 border-t-2 border-[#1C1C1C]">
            <p className="font-body text-xs text-[#1C1C1C] mb-4">
              NEED HELP? CONTACT US AT SUPPORT@ARCSTARZ.COM
            </p>
            <div className="space-y-2 text-xs font-body text-[#1C1C1C]">
              <p>• PROCESSING TIME: 2-3 BUSINESS DAYS</p>
              <p>• SHIPPING: 5-7 BUSINESS DAYS</p>
              <p>• RETURNS: 30-DAY POLICY</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ThankYouContent;
