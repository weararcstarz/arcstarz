import { Order, OrderItem, Address, PaymentMethod } from '@/types/orders';
import { OrderItem as CartItem, ShippingDetails } from '@/types/common';
import { ordersStore } from './ordersStore';

export interface CreateOrderData {
  customerEmail: string;
  customerName: string;
  loginMethod: 'email' | 'google' | 'apple' | 'github' | 'guest';
  userId?: string;
  accountCreatedAt?: string;
  lastLoginAt?: string;
  shippingDetails: ShippingDetails;
  items: CartItem[];
  total: number;
  paymentProvider: 'stripe' | 'paypal' | 'mpesa';
  transactionId: string;
  paymentMethod: PaymentMethod;
}

export function createOrderFromCheckout(data: CreateOrderData): Order {
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
    selectedColor: (item as any).selectedColor, // Type assertion for optional property
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
    status: 'paid',
    paymentStatus: 'paid',
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
        description: 'Order created',
        timestamp: now
      },
      {
        id: `event_${Date.now() + 1}`,
        type: 'paid',
        description: `Payment successful via ${data.paymentProvider}`,
        timestamp: now
      }
    ],
    metadata: {
      source: 'web',
      paymentProvider: data.paymentProvider,
      transactionId: data.transactionId
    },
    createdAt: now,
    updatedAt: now
  };

  // Save order to store
  ordersStore.addOrder(order);

  console.log(`ORDER CREATED: ${orderNumber} for ${data.customerEmail}`, {
    orderId,
    orderNumber,
    total: data.total,
    paymentProvider: data.paymentProvider,
    itemCount: orderItems.length
  });

  return order;
}

// Hook to create order after successful payment
export function useOrderCreation() {
  const createOrder = (checkoutData: CreateOrderData) => {
    try {
      const order = createOrderFromCheckout(checkoutData);
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  return { createOrder };
}
