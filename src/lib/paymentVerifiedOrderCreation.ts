import { Order, OrderItem, Address, PaymentMethod } from '@/types/orders';
import { ShippingDetails } from '@/types/common';
import { ordersStore } from './ordersStore';

export interface PaymentVerifiedOrderData {
  customerEmail: string;
  customerName: string;
  loginMethod: 'email' | 'google' | 'apple' | 'github' | 'guest';
  userId?: string;
  accountCreatedAt?: string;
  lastLoginAt?: string;
  shippingDetails: ShippingDetails;
  items: any[]; // Cart items with price, image, etc.
  total: number;
  paymentProvider: 'stripe' | 'paypal' | 'mpesa';
  transactionId: string;
  paymentMethod: PaymentMethod;
  paymentIntentId?: string; // For Stripe
  paypalOrderId?: string; // For PayPal
}

/**
 * Creates an order ONLY after successful payment verification
 * This ensures order numbers are generated after payment is confirmed
 */
export function createOrderAfterPayment(data: PaymentVerifiedOrderData): Order {
  // Generate order number only after payment verification
  const orderId = `order_${Date.now()}`;
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;

  // Convert shipping details to Address format
  const shippingAddress: Address = {
    firstName: data.shippingDetails.firstName || '',
    lastName: data.shippingDetails.lastName || '',
    street: data.shippingDetails.address || '',
    city: data.shippingDetails.city || '',
    state: data.shippingDetails.state || '',
    postalCode: data.shippingDetails.zipCode || '',
    country: data.shippingDetails.country || 'US',
    phone: data.shippingDetails.phone || ''
  };

  // Convert cart items to OrderItem format
  const orderItems: OrderItem[] = data.items.map(item => ({
    id: `item_${item.id}_${item.selectedSize}`,
    productId: item.id,
    sku: `${item.name.replace(/\s+/g, '-').toUpperCase()}-${item.selectedSize?.toUpperCase()}`,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    totalPrice: item.price * item.quantity,
    selectedSize: item.selectedSize,
    selectedColor: item.selectedColor,
    imageUrl: item.image
  }));

  const now = new Date().toISOString();

  const order: Order = {
    id: orderId,
    orderNumber,
    customerId: `cust_${Date.now()}`,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    loginMethod: data.loginMethod,
    userId: data.userId,
    accountCreatedAt: data.accountCreatedAt,
    lastLoginAt: data.lastLoginAt,
    orderDate: now,
    orderTotal: data.total,
    currency: 'USD',
    status: 'paid', // Only set to paid after payment verification
    paymentStatus: 'paid', // Only set to paid after payment verification
    fulfillmentStatus: 'pending',
    shippingAddress,
    shippingMethod: 'Standard',
    carrier: undefined,
    trackingNumbers: [],
    shipments: [],
    billingAddress: shippingAddress, // Use shipping as billing for now
    paymentMethod: data.paymentMethod,
    paymentProvider: data.paymentProvider,
    transactionId: data.transactionId,
    paymentTimeline: [
      {
        id: `pay_${Date.now()}`,
        type: 'capture',
        amount: data.total,
        currency: 'USD',
        status: 'succeeded',
        createdAt: now,
        transactionId: data.transactionId
      }
    ],
    items: orderItems,
    discounts: [],
    taxes: [],
    shippingCost: 0,
    refunds: [],
    ownerNotes: [],
    eventTimeline: [
      {
        id: `event_${Date.now()}`,
        type: 'created',
        description: 'Order created after successful payment verification',
        timestamp: now
      },
      {
        id: `event_${Date.now() + 1}`,
        type: 'paid',
        description: `Payment successfully verified via ${data.paymentProvider}`,
        timestamp: now
      }
    ],
    metadata: {
      source: 'web',
      paymentProvider: data.paymentProvider,
      transactionId: data.transactionId,
      paymentIntentId: data.paymentIntentId || '',
      paypalOrderId: data.paypalOrderId || '',
      paymentVerified: 'true',
      paymentVerifiedAt: now
    },
    createdAt: now,
    updatedAt: now
  };

  // Save order to store
  ordersStore.addOrder(order);

  console.log(`✅ PAYMENT-VERIFIED ORDER CREATED: ${orderNumber} for ${data.customerEmail}`, {
    orderId,
    orderNumber,
    total: data.total,
    paymentProvider: data.paymentProvider,
    transactionId: data.transactionId,
    itemCount: orderItems.length,
    paymentVerified: true
  });

  return order;
}

/**
 * Hook to create order only after successful payment verification
 */
export function usePaymentVerifiedOrderCreation() {
  const createOrderAfterPayment = (paymentData: PaymentVerifiedOrderData): Order => {
    try {
      const order: Order = createOrderAfterPayment(paymentData);
      return order;
    } catch (error) {
      console.error('Error creating payment-verified order:', error);
      throw error;
    }
  };

  return { createOrderAfterPayment };
}

/**
 * Validates payment data before order creation
 */
export function validatePaymentData(data: PaymentVerifiedOrderData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.customerEmail) errors.push('Customer email is required');
  if (!data.customerName) errors.push('Customer name is required');
  if (!data.items || data.items.length === 0) errors.push('Order items are required');
  if (!data.total || data.total <= 0) errors.push('Order total must be greater than 0');
  if (!data.transactionId) errors.push('Transaction ID is required');
  if (!data.paymentProvider) errors.push('Payment provider is required');
  if (!data.shippingDetails) errors.push('Shipping details are required');

  // Validate shipping details
  if (data.shippingDetails) {
    if (!data.shippingDetails.firstName) errors.push('First name is required');
    if (!data.shippingDetails.lastName) errors.push('Last name is required');
    if (!data.shippingDetails.address) errors.push('Address is required');
    if (!data.shippingDetails.city) errors.push('City is required');
    if (!data.shippingDetails.zipCode) errors.push('Zip code is required');
    if (!data.shippingDetails.country) errors.push('Country is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
