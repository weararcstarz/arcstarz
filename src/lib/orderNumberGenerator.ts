interface Order {
  id: string;
  orderNumber: string;
  productName: string;
  userId: string;
  userEmail: string;
  userName: string;
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  paymentId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface OrderCounter {
  [productName: string]: number;
}

class OrderNumberGenerator {
  private static instance: OrderNumberGenerator;
  private countersFile: string;
  private ordersFile: string;
  private counters: OrderCounter;

  private constructor() {
    this.countersFile = 'orderCounters.json';
    this.ordersFile = 'orders.json';
    this.counters = this.loadCounters();
  }

  public static getInstance(): OrderNumberGenerator {
    if (!OrderNumberGenerator.instance) {
      OrderNumberGenerator.instance = new OrderNumberGenerator();
    }
    return OrderNumberGenerator.instance;
  }

  private loadCounters(): OrderCounter {
    try {
      // In a real app, this would load from a database
      // For now, we'll use localStorage as fallback
      const stored = localStorage.getItem('arcstarz_order_counters');
      if (stored) {
        return JSON.parse(stored);
      }
      return {};
    } catch (error) {
      console.error('Error loading order counters:', error);
      return {};
    }
  }

  private saveCounters(): void {
    try {
      localStorage.setItem('arcstarz_order_counters', JSON.stringify(this.counters));
    } catch (error) {
      console.error('Error saving order counters:', error);
    }
  }

  private normalizeProductName(productName: string): string {
    return productName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Remove non-alphanumeric characters
      .replace(/\s+/g, ''); // Remove spaces
  }

  private formatOrderNumber(productName: string, sequence: number): string {
    const normalizedName = this.normalizeProductName(productName);
    const paddedSequence = sequence.toString().padStart(4, '0');
    return `${normalizedName}-${paddedSequence}`;
  }

  /**
   * ONLY generate order number AFTER payment is confirmed
   * This is the correct flow - no order number until payment succeeds
   */
  public generateOrderNumberAfterPayment(productName: string): string {
    const normalizedName = this.normalizeProductName(productName);
    
    // Get current counter for this product (default to 0)
    const currentCounter = this.counters[normalizedName] || 0;
    
    // Increment counter ONLY after successful payment
    const newCounter = currentCounter + 1;
    this.counters[normalizedName] = newCounter;
    
    // Save updated counters
    this.saveCounters();
    
    // Generate order number
    const orderNumber = this.formatOrderNumber(productName, newCounter);
    
    console.log(`✅ PAYMENT CONFIRMED - Generated order number: ${orderNumber} for product: ${productName}`);
    console.log(`📈 Updated counter for ${normalizedName}: ${newCounter}`);
    
    return orderNumber;
  }

  /**
   * Create order ONLY after payment confirmation
   * This should only be called after payment webhook confirms success
   */
  public async createOrderAfterPayment(orderData: {
    paymentId: string;
    productName: string;
    userId: string;
    userEmail: string;
    userName: string;
    total: number;
    currency: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }): Promise<Order> {
    console.log('=== CREATING ORDER AFTER PAYMENT CONFIRMATION ===');
    console.log('Payment ID:', orderData.paymentId);
    console.log('Product:', orderData.productName);
    console.log('User:', orderData.userEmail);
    
    // Step 1: Generate unique order number (ONLY after payment confirmed)
    const orderNumber = this.generateOrderNumberAfterPayment(orderData.productName);
    
    // Step 2: Create order object with payment reference
    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderNumber,
      productName: orderData.productName,
      userId: orderData.userId,
      userEmail: orderData.userEmail,
      userName: orderData.userName,
      total: orderData.total,
      currency: orderData.currency,
      status: 'paid', // Payment already confirmed
      createdAt: new Date().toISOString(),
      paymentId: orderData.paymentId, // Link to payment
      items: orderData.items
    };
    
    // Step 3: Save order (in a real app, this would save to database)
    await this.saveOrder(order);
    
    console.log(`✅ Order created after payment: ${orderNumber}`);
    console.log(`💰 Payment ID: ${orderData.paymentId}`);
    console.log(`📧 Customer: ${orderData.userEmail}`);
    console.log('=== ORDER CREATION COMPLETE ===');
    
    return order;
  }

  private async saveOrder(order: Order): Promise<void> {
    try {
      // Get existing orders
      const existingOrders = this.getOrders();
      
      // Add new order
      existingOrders.push(order);
      
      // Save to localStorage (in a real app, this would be a database)
      localStorage.setItem('arcstarz_orders', JSON.stringify(existingOrders));
      
      console.log(`💾 Order saved: ${order.orderNumber}`);
    } catch (error) {
      console.error('Error saving order:', error);
      throw new Error('Failed to save order');
    }
  }

  public getOrders(): Order[] {
    try {
      const stored = localStorage.getItem('arcstarz_orders');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }

  public async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      const orders = this.getOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);
      
      if (orderIndex === -1) {
        throw new Error('Order not found');
      }
      
      const order = orders[orderIndex];
      if (order) {
        order.status = status;
        localStorage.setItem('arcstarz_orders', JSON.stringify(orders));
        console.log(`📦 Order ${order.orderNumber} status updated to: ${status}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  public getOrderCounters(): OrderCounter {
    return { ...this.counters };
  }

  public resetCounter(productName: string): void {
    const normalizedName = this.normalizeProductName(productName);
    this.counters[normalizedName] = 0;
    this.saveCounters();
    console.log(`🔄 Counter reset for product: ${normalizedName}`);
  }

  /**
   * Handle multiple products after payment confirmation
   * Each product gets its own order number
   */
  public async createMultipleOrdersAfterPayment(orderData: {
    paymentId: string;
    userId: string;
    userEmail: string;
    userName: string;
    currency: string;
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
    console.log(`=== CREATING MULTIPLE ORDERS AFTER PAYMENT ===`);
    console.log(`Payment ID: ${orderData.paymentId}`);
    console.log(`Products: ${orderData.products.length}`);
    
    const orders: Order[] = [];
    
    // Step 7: Create separate order for each product
    for (const product of orderData.products) {
      const productTotal = product.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      console.log(`\n--- Processing Product: ${product.name} ---`);
      
      const order = await this.createOrderAfterPayment({
        paymentId: orderData.paymentId,
        productName: product.name,
        userId: orderData.userId,
        userEmail: orderData.userEmail,
        userName: orderData.userName,
        total: productTotal,
        currency: orderData.currency,
        items: product.items
      });
      
      orders.push(order);
    }
    
    console.log(`✅ Created ${orders.length} orders for payment: ${orderData.paymentId}`);
    console.log('=== MULTIPLE ORDERS CREATION COMPLETE ===');
    
    return orders;
  }
}

export default OrderNumberGenerator;
export type { Order, OrderCounter };
