'use client';

import { useState } from 'react';
import PaymentHandler from '@/lib/paymentHandler';

interface Product {
  name: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export default function OrderNumberDemo() {
  const [userEmail, setUserEmail] = useState('customer@example.com');
  const [userName, setUserName] = useState('John Doe');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['T-SHIRT']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');

  const availableProducts: Product[] = [
    {
      name: 'T-SHIRT',
      items: [
        { id: 'ts1', name: 'ARCSTARZ T-Shirt', price: 2999, quantity: 1 } // $29.99 in cents
      ]
    },
    {
      name: 'CAP',
      items: [
        { id: 'cap1', name: 'ARCSTARZ Cap', price: 1999, quantity: 1 } // $19.99 in cents
      ]
    },
    {
      name: 'HOODIE',
      items: [
        { id: 'hoodie1', name: 'ARCSTARZ Hoodie', price: 4999, quantity: 1 } // $49.99 in cents
      ]
    }
  ];

  const handleProductToggle = (productName: string) => {
    setSelectedProducts(prev => 
      prev.includes(productName) 
        ? prev.filter(p => p !== productName)
        : [...prev, productName]
    );
  };

  const handleProcessPayment = async () => {
    if (selectedProducts.length === 0) {
      setResult('❌ Please select at least one product');
      return;
    }

    setIsProcessing(true);
    setResult('');

    try {
      const paymentHandler = PaymentHandler.getInstance();
      
      // Get selected products
      const products = availableProducts.filter(p => selectedProducts.includes(p.name));
      
      console.log('\n=== STARTING PAYMENT PROCESS ===');
      console.log('🛒 Customer:', userEmail);
      console.log('📦 Products:', selectedProducts.join(', '));
      console.log('💰 Total:', formatCurrency(calculateTotal()));
      console.log('⚠️  NO ORDER NUMBERS YET - WAITING FOR PAYMENT CONFIRMATION');
      
      // Step 1: Simulate payment processing (in real app, this would be Stripe/PayPal)
      console.log('\n📡 Processing payment with Stripe/PayPal...');
      console.log('💳 Payment initiated - waiting for webhook confirmation...');
      
      // Simulate payment confirmation webhook (this happens AFTER payment succeeds)
      const orders = await paymentHandler.simulatePaymentConfirmation({
        userEmail,
        userName,
        products
      });

      setResult(`✅ Payment processed successfully! ${orders.length} order(s) created. Check console for order numbers.`);
    } catch (error) {
      console.error('Payment processing error:', error);
      setResult('❌ Payment processing failed. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const calculateTotal = (): number => {
    return selectedProducts.reduce((total, productName) => {
      const product = availableProducts.find(p => p.name === productName);
      if (product) {
        return total + product.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
      return total;
    }, 0);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🛒 Order Number System Demo</h2>
      
      <div className="space-y-6">
        {/* User Information */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Select Products</h3>
          <div className="space-y-2">
            {availableProducts.map((product) => (
              <label key={product.name} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.name)}
                  onChange={() => handleProductToggle(product.name)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-medium text-gray-700">{product.name}</span>
                  <span className="text-gray-600">
                    {product.items.map(item => `${item.name} - ${formatCurrency(item.price)}`).join(', ')}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Order Summary</h3>
          <div className="space-y-2">
            {selectedProducts.length === 0 ? (
              <p className="text-gray-500 italic">No products selected</p>
            ) : (
              <>
                {selectedProducts.map(productName => {
                  const product = availableProducts.find(p => p.name === productName);
                  return product ? (
                    <div key={productName} className="flex justify-between text-sm">
                      <span className="text-gray-600">{productName}</span>
                      <span className="font-medium">
                        {formatCurrency(product.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                      </span>
                    </div>
                  ) : null;
                })}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcessPayment}
          disabled={isProcessing || selectedProducts.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? '⏳ Processing Payment...' : '💳 Process Payment'}
        </button>

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg ${result.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="font-medium">{result}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Correct Payment Flow (Order Numbers AFTER Payment):</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Customer selects products and enters payment info</li>
            <li>Payment is processed with Stripe/PayPal (NO order numbers yet)</li>
            <li>Payment processor sends webhook confirmation AFTER success</li>
            <li>ONLY THEN: Order numbers are generated (TSHIRT-0001, CAP-0001, etc.)</li>
            <li>Orders are saved with payment reference</li>
            <li>Customer receives order numbers via email/confirmation</li>
          </ol>
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <strong>⚠️ Important:</strong> Order numbers are NEVER generated before payment confirmation.
            Failed payments = NO order numbers created.
          </div>
        </div>
      </div>
    </div>
  );
}
