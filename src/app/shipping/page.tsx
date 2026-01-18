'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { usePerfectCurrency } from '@/contexts/PerfectCurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  addressLine2: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  deliveryInstructions: string;
}

export default function Shipping() {
  const router = useRouter();
  const { cartItems, cartTotal } = useCart();
  const { formatPrice } = usePerfectCurrency();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: Log cart items
  console.log('Shipping cart items:', cartItems);

  // Check if user is logged in and redirect if not
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // Check if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/shop');
      return;
    }
  }, [cartItems, router]);

  // Initialize form with user data if available
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    addressLine2: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    deliveryInstructions: '',
  });

  // Load saved shipping details from localStorage
  useEffect(() => {
    const savedShipping = localStorage.getItem('arcstarz_shipping_details');
    if (savedShipping) {
      try {
        const parsed = JSON.parse(savedShipping);
        setShippingDetails(prev => ({
          ...prev,
          ...parsed,
          email: user?.email || parsed.email || '', // Always prioritize logged-in user email
        }));
      } catch (error) {
        console.error('Error loading shipping details:', error);
      }
    }
  }, [user?.email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'zipCode', 'country'];
      const missingFields = requiredFields.filter(field => !shippingDetails[field as keyof ShippingDetails]);
      
      if (missingFields.length > 0) {
        alert('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Save shipping details to localStorage
      localStorage.setItem('arcstarz_shipping_details', JSON.stringify(shippingDetails));
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Shipping details saved:', shippingDetails);
      }
      
      // Redirect to checkout page
      router.push('/checkout');
    } catch (error) {
      console.error('Error saving shipping details:', error);
      alert('Failed to save shipping details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F0]">
        <Navbar />
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-headline text-4xl tracking-tight mb-8">YOUR CART IS EMPTY</h1>
            <button 
              onClick={() => router.push('/shop')}
              className="btn-primary hover-lift"
            >
              CONTINUE SHOPPING
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
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
              SHIPPING DETAILS
            </h1>
            <p className="font-body text-xs md:text-sm tracking-wide text-black/60">
              Enter your delivery information
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8 md:mb-12 overflow-x-auto">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-black text-white rounded-full flex items-center justify-center font-body text-xs md:text-sm font-bold">1</div>
                <span className="ml-1 md:ml-2 font-body text-xs md:text-sm font-medium">SHIPPING</span>
              </div>
              <div className="w-4 md:w-8 h-0.5 bg-black/20"></div>
              <div className="flex items-center">
                <div className="w-6 h-6 md:w-8 md:h-8 border border-black/20 bg-transparent text-black/40 rounded-full flex items-center justify-center font-body text-xs md:text-sm font-bold">2</div>
                <span className="ml-1 md:ml-2 font-body text-xs md:text-sm text-black/40">PAYMENT</span>
              </div>
              <div className="w-4 md:w-8 h-0.5 bg-black/20"></div>
              <div className="flex items-center">
                <div className="w-6 h-6 md:w-8 md:h-8 border border-black/20 bg-transparent text-black/40 rounded-full flex items-center justify-center font-body text-xs md:text-sm font-bold">3</div>
                <span className="ml-1 md:ml-2 font-body text-xs md:text-sm text-black/40">CONFIRM</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
            {/* Shipping Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                {/* Contact Information */}
                <div className="bg-white border border-black/10 p-4 md:p-6">
                  <h2 className="font-body text-sm md:text-base tracking-tight mb-4 md:mb-6 text-black font-medium">CONTACT INFORMATION</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">FIRST NAME *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={shippingDetails.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                        placeholder="John"
                      />
                    </div>
                    
                    <div>
                      <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">LAST NAME *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={shippingDetails.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
                    <div>
                      <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">EMAIL ADDRESS *</label>
                      <input
                        type="email"
                        name="email"
                        value={shippingDetails.email}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                        placeholder="john@example.com"
                        readOnly={!!user?.email}
                      />
                      {user?.email && (
                        <p className="mt-2 text-xs text-black/40">Email from your account</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">PHONE NUMBER *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingDetails.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border border-black/10 p-4 md:p-6">
                  <h2 className="font-body text-sm md:text-base tracking-tight mb-4 md:mb-6 text-black font-medium">SHIPPING ADDRESS</h2>
                  
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">STREET ADDRESS *</label>
                      <input
                        type="text"
                        name="address"
                        value={shippingDetails.address}
                        onChange={handleInputChange}
                        required
                        className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div>
                      <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">APARTMENT/SUITE (OPTIONAL)</label>
                      <input
                        type="text"
                        name="apartment"
                        value={shippingDetails.apartment}
                        onChange={handleInputChange}
                        className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                        placeholder="Apt 4B, Suite 200, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">CITY *</label>
                        <input
                          type="text"
                          name="city"
                          value={shippingDetails.city}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                          placeholder="New York"
                        />
                      </div>
                      
                      <div>
                        <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">STATE/PROVINCE</label>
                        <input
                          type="text"
                          name="state"
                          value={shippingDetails.state}
                          onChange={handleInputChange}
                          className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                          placeholder="NY"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">ZIP CODE *</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={shippingDetails.zipCode}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                          placeholder="10001"
                        />
                      </div>
                      
                      <div>
                        <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">COUNTRY *</label>
                        <select
                          name="country"
                          value={shippingDetails.country}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AU">Australia</option>
                          <option value="KE">Kenya</option>
                          <option value="UG">Uganda</option>
                          <option value="TZ">Tanzania</option>
                          <option value="ZA">South Africa</option>
                          <option value="NG">Nigeria</option>
                          <option value="GH">Ghana</option>
                          <option value="FR">France</option>
                          <option value="DE">Germany</option>
                          <option value="IT">Italy</option>
                          <option value="ES">Spain</option>
                          <option value="NL">Netherlands</option>
                          <option value="JP">Japan</option>
                          <option value="CN">China</option>
                          <option value="IN">India</option>
                          <option value="BR">Brazil</option>
                          <option value="MX">Mexico</option>
                          <option value="AE">United Arab Emirates</option>
                          <option value="SA">Saudi Arabia</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-body text-xs md:text-sm font-medium mb-2 text-black/60">DELIVERY INSTRUCTIONS (OPTIONAL)</label>
                      <textarea
                        name="deliveryInstructions"
                        value={shippingDetails.deliveryInstructions}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-3 md:p-4 bg-white text-black font-body text-sm border border-black/20 focus:border-black outline-none transition-all resize-none"
                        placeholder="Leave at front door, ring doorbell, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white px-6 py-3 md:py-4 text-sm font-body font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'SAVING...' : 'CONTINUE TO PAYMENT'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-black/10 p-4 md:p-6 sticky top-24">
                <h2 className="font-body text-sm md:text-base tracking-tight mb-4 md:mb-6 text-black font-medium">ORDER SUMMARY</h2>
                
                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 md:w-16 md:h-16 bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain"
                          onError={(e: any) => {
                            console.error('Image failed to load in shipping:', item.image, e);
                            e.currentTarget.src = '/products/slytherinetee-black.png';
                          }}
                          onLoad={() => console.log('Image loaded in shipping:', item.image)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body text-xs md:text-sm font-medium text-black truncate">{item.name}</h3>
                        <p className="font-body text-xs text-black/60">Size {item.selectedSize} × {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-body text-xs md:text-sm font-medium text-black">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-black/10 pt-4 space-y-2">
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
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
