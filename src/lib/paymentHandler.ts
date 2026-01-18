import OrderNumberGenerator, { Order } from './orderNumberGenerator';

interface PaymentConfirmation {
  paymentId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  userId: string;
  userEmail: string;
  userName: string;
  products: Array<{
    name: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }>;
}

class PaymentHandler {
  private static instance: PaymentHandler;
  private orderGenerator: OrderNumberGenerator;

  private constructor() {
    this.orderGenerator = OrderNumberGenerator.getInstance();
  }

  public static getInstance(): PaymentHandler {
    if (!PaymentHandler.instance) {
      PaymentHandler.instance = new PaymentHandler();
    }
    return PaymentHandler.instance;
  }

  /**
   * Step 1: Wait for payment confirmation
   * This is called ONLY when payment webhook confirms success
   * NO order numbers exist before this point
   */
  public async handlePaymentConfirmation(paymentData: PaymentConfirmation): Promise<Order[]> {
    console.log('=== PAYMENT CONFIRMATION WEBHOOK RECEIVED ===');
    console.log('💰 Payment ID:', paymentData.paymentId);
    console.log('✅ Status:', paymentData.status);
    console.log('💵 Amount:', this.formatCurrency(paymentData.amount, paymentData.currency));
    console.log('👤 Customer:', paymentData.userEmail);
    console.log('📦 Products:', paymentData.products.map(p => p.name));

    // Step 1: ENSURE payment is successful - CRITICAL CHECK
    if (paymentData.status !== 'success') {
      console.log('❌ Payment not successful - NO ORDERS CREATED');
      console.log('=== PAYMENT REJECTED ===');
      return [];
    }

    console.log('✅ PAYMENT CONFIRMED - NOW CREATING ORDERS');
    console.log('📝 Order numbers will be generated NOW (after payment)');

    try {
      // Step 2-7: Create orders ONLY after payment is confirmed
      const orders = await this.createOrdersAfterPaymentConfirmation(paymentData);
      
      // Step 6: Display order numbers to user (now that they exist)
      this.displayOrderConfirmation(orders);
      
      // In a real app, you would also:
      // - Send confirmation email with order numbers
      // - Update inventory
      // - Notify fulfillment team
      // - Create shipping labels
      
      console.log('=== ORDER CREATION COMPLETE (AFTER PAYMENT) ===');
      return orders;
    } catch (error) {
      console.error('❌ Error creating orders after payment:', error);
      throw error;
    }
  }

  /**
   * Step 2-7: Create orders ONLY after payment confirmation
   * This is the correct flow - no orders until payment succeeds
   */
  private async createOrdersAfterPaymentConfirmation(paymentData: PaymentConfirmation): Promise<Order[]> {
    console.log('\n=== CREATING ORDERS AFTER PAYMENT CONFIRMATION ===');
    
    // Step 2: Get product names (now that payment is confirmed)
    const productNames = paymentData.products.map(p => p.name);
    console.log('📦 Processing products (after payment):', productNames);

    // Step 7: Handle multiple products - each gets its own order number
    const orders = await this.orderGenerator.createMultipleOrdersAfterPayment({
      paymentId: paymentData.paymentId, // Link orders to this payment
      userId: paymentData.userId,
      userEmail: paymentData.userEmail,
      userName: paymentData.userName,
      currency: paymentData.currency,
      products: paymentData.products
    });

    console.log(`✅ Created ${orders.length} orders after payment confirmation`);
    return orders;
  }

  /**
   * Step 6: Display order confirmation (now that orders exist)
   */
  private displayOrderConfirmation(orders: Order[]): void {
    console.log('\n=== ORDER CONFIRMATION (AFTER PAYMENT) ===');
    
    if (orders.length === 0) {
      console.log('❌ No orders created - payment may have failed');
      return;
    }
    
    if (orders.length === 1) {
      // Single product order
      const order = orders[0];
      if (order) {
        console.log(`🎉 Thank you for your order! Your order number is: ${order.orderNumber}`);
        console.log(`📦 Product: ${order.productName}`);
        console.log(`💰 Total: ${this.formatCurrency(order.total, order.currency)}`);
        console.log(`💳 Payment ID: ${order.paymentId}`);
      }
    } else {
      // Multiple product orders
      console.log(`🎉 Thank you for your orders! You have ${orders.length} orders:`);
      orders.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.orderNumber} - ${order.productName} (${this.formatCurrency(order.total, order.currency)})`);
      });
      const firstOrder = orders[0];
      if (firstOrder) {
        console.log(`💰 Total amount: ${this.formatCurrency(orders.reduce((sum, order) => sum + order.total, 0), firstOrder.currency)}`);
        console.log(`💳 Payment ID: ${firstOrder.paymentId}`);
      }
    }
    
    console.log('\n✅ Order numbers have been assigned and orders saved.');
    console.log('📧 You will receive a confirmation email with your order numbers.');
    console.log('📦 Your orders will be processed shortly.');
    console.log('=== END ORDER CONFIRMATION ===');
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount / 100); // Convert from cents if needed
  }

  /**
   * Simulate payment confirmation for testing
   * This simulates a webhook from Stripe/PayPal confirming payment success
   */
  public async simulatePaymentConfirmation(testData: {
    userEmail: string;
    userName: string;
    products: Array<{
      name: string;
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>;
    }>;
  }): Promise<Order[]> {
    console.log('\n=== SIMULATING PAYMENT WEBHOOK ===');
    
    // Simulate payment confirmation from payment processor
    const paymentData: PaymentConfirmation = {
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'success', // Payment confirmed
      amount: testData.products.reduce((sum, product) => 
        sum + product.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0
      ),
      currency: 'USD',
      userId: `user_${Date.now()}`,
      userEmail: testData.userEmail,
      userName: testData.userName,
      products: testData.products
    };

    console.log('📡 Simulating webhook from payment processor...');
    console.log('💰 Payment confirmed by Stripe/PayPal');
    
    // Now handle the confirmed payment (create orders)
    return await this.handlePaymentConfirmation(paymentData);
  }

  /**
   * Get all orders for a user
   */
  public getUserOrders(userId: string): Order[] {
    const allOrders = this.orderGenerator.getOrders();
    return allOrders.filter(order => order.userId === userId);
  }

  /**
   * Get order by order number
   */
  public getOrderByOrderNumber(orderNumber: string): Order | null {
    const allOrders = this.orderGenerator.getOrders();
    return allOrders.find(order => order.orderNumber === orderNumber) || null;
  }

  /**
   * Update order status (for fulfillment)
   */
  public async updateOrderStatus(orderNumber: string, status: Order['status']): Promise<void> {
    const order = this.getOrderByOrderNumber(orderNumber);
    if (!order) {
      throw new Error(`Order not found: ${orderNumber}`);
    }

    await this.orderGenerator.updateOrderStatus(order.id, status);
    console.log(`📦 Order ${orderNumber} status updated to: ${status}`);
  }

  /**
   * Get order statistics
   */
  public getOrderStats(): {
    totalOrders: number;
    ordersByProduct: Record<string, number>;
    totalRevenue: number;
  } {
    const allOrders = this.orderGenerator.getOrders();
    const ordersByProduct: Record<string, number> = {};
    let totalRevenue = 0;

    allOrders.forEach(order => {
      ordersByProduct[order.productName] = (ordersByProduct[order.productName] || 0) + 1;
      totalRevenue += order.total;
    });

    return {
      totalOrders: allOrders.length,
      ordersByProduct,
      totalRevenue
    };
  }

  /**
   * Handle failed payment (no orders created)
   */
  public async handlePaymentFailure(paymentData: {
    paymentId: string;
    userEmail: string;
    reason: string;
  }): Promise<void> {
    console.log('=== PAYMENT FAILURE HANDLED ===');
    console.log('❌ Payment ID:', paymentData.paymentId);
    console.log('👤 Customer:', paymentData.userEmail);
    console.log('🚫 Reason:', paymentData.reason);
    console.log('❌ NO ORDERS CREATED - PAYMENT FAILED');
    console.log('=== PAYMENT FAILURE COMPLETE ===');
    
    // In a real app, you would:
    // - Send failure notification email
    // - Log the failure for analysis
    // - Maybe offer retry options
  }
}

export default PaymentHandler;
export type { PaymentConfirmation };
