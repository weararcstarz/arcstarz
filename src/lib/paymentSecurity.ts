import crypto from 'crypto';
import { env } from './envValidation';

export class PaymentSecurityError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PaymentSecurityError';
  }
}

export class PaymentSecurityManager {
  private static readonly WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
  private static readonly PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';
  
  // Validate Stripe keys
  static validateStripeKeys(): void {
    const publishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const secretKey = env.STRIPE_SECRET_KEY;
    
    if (!publishableKey || !secretKey) {
      throw new PaymentSecurityError('Stripe keys are not configured', 'MISSING_KEYS');
    }
    
    // Check key types
    if (env.NODE_ENV === 'production') {
      if (!publishableKey.startsWith('pk_live_')) {
        throw new PaymentSecurityError('Live Stripe keys must start with pk_live_', 'INVALID_LIVE_KEY');
      }
      
      if (!secretKey.startsWith('sk_live_')) {
        throw new PaymentSecurityError('Live Stripe secret must start with sk_live_', 'INVALID_LIVE_SECRET');
      }
    } else {
      // In development, ensure we're using test keys
      if (publishableKey.startsWith('pk_live_') || secretKey.startsWith('sk_live_')) {
        throw new PaymentSecurityError('Cannot use live Stripe keys in development', 'LIVE_KEYS_IN_DEV');
      }
    }
    
    // Validate key format
    if (!publishableKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
      throw new PaymentSecurityError('Invalid Stripe key format', 'INVALID_KEY_FORMAT');
    }
  }
  
  // Validate PayPal keys
  static validatePayPalKeys(): void {
    const clientId = env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = env.PAYPAL_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new PaymentSecurityError('PayPal keys are not configured', 'MISSING_KEYS');
    }
    
    if (clientId.length < 10 || clientSecret.length < 10) {
      throw new PaymentSecurityError('Invalid PayPal key format', 'INVALID_KEY_FORMAT');
    }
  }
  
  // Validate payment amount
  static validateAmount(amount: number): void {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new PaymentSecurityError('Invalid payment amount', 'INVALID_AMOUNT');
    }
    
    if (amount <= 0) {
      throw new PaymentSecurityError('Payment amount must be positive', 'INVALID_AMOUNT');
    }
    
    if (amount > 999999.99) {
      throw new PaymentSecurityError('Payment amount exceeds maximum limit', 'AMOUNT_TOO_HIGH');
    }
  }
  
  // Validate currency
  static validateCurrency(currency: string): void {
    const allowedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'];
    
    if (!allowedCurrencies.includes(currency.toUpperCase())) {
      throw new PaymentSecurityError(`Unsupported currency: ${currency}`, 'UNSUPPORTED_CURRENCY');
    }
  }
  
  // Generate secure order ID
  static generateOrderId(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(8).toString('hex');
    return `order_${timestamp}_${random}`;
  }
  
  // Generate idempotency key
  static generateIdempotencyKey(userId: string, amount: number, currency: string): string {
    const data = `${userId}_${amount}_${currency}_${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  // Verify Stripe webhook signature
  static verifyStripeWebhook(payload: string, signature: string): boolean {
    if (!this.WEBHOOK_SECRET) {
      console.warn('Stripe webhook secret not configured');
      return false;
    }
    
    try {
      const elements = signature.split(',');
      const timestamp = elements[0];
      const signatures = elements.slice(1);
      
      const signedPayload = `${timestamp}.${payload}`;
      
      for (const sig of signatures) {
        const expectedSig = crypto
          .createHmac('sha256', this.WEBHOOK_SECRET)
          .update(signedPayload, 'utf8')
          .digest('hex');
        
        if (crypto.timingSafeEqual(Buffer.from(expectedSig, 'hex'), Buffer.from(sig, 'hex'))) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }
  
  // Verify PayPal webhook signature
  static verifyPayPalWebhook(payload: string, headers: Record<string, string>): boolean {
    if (!this.PAYPAL_WEBHOOK_ID) {
      console.warn('PayPal webhook ID not configured');
      return false;
    }
    
    try {
      const authAlgo = headers['paypal-auth-algo'];
      const transmissionId = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const transmissionSig = headers['paypal-transmission-sig'];
      const timestamp = headers['paypal-transmission-time'];
      
      if (!authAlgo || !transmissionId || !certId || !transmissionSig || !timestamp) {
        return false;
      }
      
      // In a real implementation, you would verify against PayPal's public certificates
      // For now, we'll do basic validation
      const webhookUrl = env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const expectedPayload = `${transmissionId}|${timestamp}|${webhookUrl}`;
      
      // This is a simplified verification - in production, use PayPal's SDK
      return transmissionSig.length > 50; // Basic length check
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }
  
  // Sanitize payment data
  static sanitizePaymentData(data: any): any {
    const sanitized: any = {};
    
    // Only allow specific fields
    const allowedFields = [
      'amount', 'currency', 'orderId', 'customerId', 'customerEmail',
      'customerName', 'paymentMethod', 'paymentIntentId', 'sessionId'
    ];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        switch (field) {
          case 'amount':
            sanitized[field] = Math.max(0, Number(data[field]));
            break;
          case 'currency':
            sanitized[field] = String(data[field]).toUpperCase().substring(0, 3);
            break;
          case 'orderId':
          case 'customerId':
          case 'customerEmail':
          case 'customerName':
          case 'paymentMethod':
          case 'paymentIntentId':
          case 'sessionId':
            sanitized[field] = String(data[field]).trim().substring(0, 255);
            break;
        }
      }
    });
    
    return sanitized;
  }
  
  // Check for duplicate payment
  static checkDuplicatePayment(orderId: string, existingOrders: any[]): boolean {
    return existingOrders.some(order => order.orderId === orderId);
  }
  
  // Create secure payment intent
  static createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>): any {
    this.validateAmount(amount);
    this.validateCurrency(currency);
    
    return {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toUpperCase(),
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      idempotency_key: this.generateIdempotencyKey('user', amount, currency)
    };
  }
  
  // Validate payment method
  static validatePaymentMethod(paymentMethod: string): void {
    const allowedMethods = ['card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer'];
    
    if (!allowedMethods.includes(paymentMethod)) {
      throw new PaymentSecurityError(`Unsupported payment method: ${paymentMethod}`, 'UNSUPPORTED_METHOD');
    }
  }
  
  // Check for suspicious activity
  static checkSuspiciousActivity(userId: string, amount: number, userHistory: any[]): boolean {
    // Check for rapid successive payments
    const recentPayments = userHistory
      .filter(payment => Date.now() - new Date(payment.createdAt).getTime() < 60000) // Last minute
      .filter(payment => payment.userId === userId);
    
    if (recentPayments.length > 5) {
      return true; // Too many payments in last minute
    }
    
    // Check for unusually large payment
    const avgPayment = userHistory.reduce((sum, payment) => sum + payment.amount, 0) / userHistory.length || 0;
    
    if (amount > avgPayment * 10 && amount > 1000) {
      return true; // Payment is 10x average and over $1000
    }
    
    return false;
  }
  
  // Log payment event
  static logPaymentEvent(event: string, data: any, level: 'info' | 'warn' | 'error' = 'info'): void {
    const logData = {
      timestamp: new Date().toISOString(),
      event,
      level,
      data: {
        ...data,
        // Remove sensitive data from logs
        cardNumber: data.cardNumber ? '****-****-****-****' : undefined,
        cvv: undefined,
        fullCardData: undefined
      }
    };
    
    if (level === 'error') {
      console.error('Payment Error:', JSON.stringify(logData));
    } else if (level === 'warn') {
      console.warn('Payment Warning:', JSON.stringify(logData));
    } else {
      console.log('Payment Info:', JSON.stringify(logData));
    }
  }
  
  // Initialize payment security
  static initialize(): void {
    try {
      this.validateStripeKeys();
      this.validatePayPalKeys();
      console.log('✅ Payment security initialized');
    } catch (error) {
      console.error('❌ Payment security initialization failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
}

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Payment method constants
export const PAYMENT_METHODS = {
  CARD: 'card',
  PAYPAL: 'paypal',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  BANK_TRANSFER: 'bank_transfer'
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Currency constants
export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CAD: 'CAD',
  AUD: 'AUD',
  JPY: 'JPY',
  CHF: 'CHF',
  SEK: 'SEK',
  NOK: 'NOK',
  DKK: 'DKK'
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];
