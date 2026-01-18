export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  loginMethod: 'email' | 'google' | 'apple' | 'github' | 'guest';
  userId?: string;
  accountCreatedAt?: string;
  lastLoginAt?: string;
  
  // Order details
  orderDate: string;
  orderTotal: number; // in cents
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Shipping
  shippingAddress: Address;
  shippingMethod: string;
  carrier?: string;
  trackingNumbers: string[];
  shipments: Shipment[];
  
  // Billing
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentProvider: string;
  transactionId: string;
  paymentTimeline: PaymentEvent[];
  
  // Order contents
  items: OrderItem[];
  discounts: Discount[];
  taxes: Tax[];
  shippingCost: number;
  refunds: Refund[];
  
  // Owner-only
  ownerNotes: OwnerNote[];
  eventTimeline: OrderEvent[];
  
  // Metadata
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  street2?: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  deliveryInstructions?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  status: 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'failed';
  shippedAt?: string;
  deliveredAt?: string;
  items: string[]; // Order item IDs
  trackingUrl?: string;
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'mpesa' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  wallet?: string;
}

export interface PaymentEvent {
  id: string;
  type: 'authorization' | 'capture' | 'refund' | 'partial_refund' | 'failure';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
  transactionId?: string;
  gatewayResponse?: any;
}

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedSize?: string;
  selectedColor?: string;
  imageUrl?: string;
}

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
}

export interface Tax {
  name: string;
  rate: number;
  amount: number;
}

export interface Refund {
  id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  createdAt: string;
  processedAt?: string;
  items?: string[]; // Order item IDs for partial refunds
}

export interface OwnerNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderEvent {
  id: string;
  type: 'created' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'note_added';
  description: string;
  timestamp: string;
  metadata?: any;
}

// API Response types
export interface OrdersListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderFilters {
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: PaymentEvent['status'][];
  fulfillmentStatus?: Order['fulfillmentStatus'][];
  totalMin?: number;
  totalMax?: number;
  search?: string;
}

export interface CreateRefundRequest {
  orderId: string;
  amount: number;
  reason: string;
  itemIds?: string[]; // for partial refunds
}

export interface UpdateFulfillmentRequest {
  orderId: string;
  status: Order['fulfillmentStatus'];
  trackingNumbers?: string[];
  carrier?: string;
  shipments?: Partial<Shipment>[];
}

export interface AddOwnerNoteRequest {
  orderId: string;
  content: string;
}
