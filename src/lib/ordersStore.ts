import { Order } from '@/types/orders';

// In-memory order store for development
// In production, this would be replaced with a proper database
class OrdersStore {
  private orders: Order[] = [];
  private readonly STORAGE_KEY = 'arcstarz_orders';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.orders = JSON.parse(stored);
        } else {
          // Initialize with sample data
          this.initializeSampleData();
        }
      } catch (error) {
        console.error('Error loading orders from storage:', error);
        this.initializeSampleData();
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.orders));
      } catch (error) {
        console.error('Error saving orders to storage:', error);
      }
    }
  }

  private initializeSampleData() {
    this.orders = [
      {
        id: 'order_1',
        orderNumber: 'ORD-2024-001',
        customerId: 'cust_1',
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        loginMethod: 'email',
        userId: 'user_1',
        accountCreatedAt: '2024-01-15T10:00:00Z',
        lastLoginAt: '2024-01-20T14:30:00Z',
        orderDate: '2024-01-20T15:00:00Z',
        orderTotal: 2500,
        currency: 'USD',
        status: 'shipped',
        paymentStatus: 'paid',
        fulfillmentStatus: 'shipped',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '+1-555-0123'
        },
        shippingMethod: 'Standard',
        carrier: 'UPS',
        trackingNumbers: ['1Z999AA10123456784'],
        shipments: [
          {
            id: 'ship_1',
            trackingNumber: '1Z999AA10123456784',
            carrier: 'UPS',
            status: 'shipped',
            shippedAt: '2024-01-21T10:00:00Z',
            items: ['item_1']
          }
        ],
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '+1-555-0123'
        },
        paymentMethod: {
          type: 'card',
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2025
        },
        paymentProvider: 'stripe',
        transactionId: 'pi_3P1234567890',
        paymentTimeline: [
          {
            id: 'pay_1',
            type: 'authorization',
            amount: 2500,
            currency: 'USD',
            status: 'succeeded',
            createdAt: '2024-01-20T15:01:00Z',
            transactionId: 'pi_3P1234567890'
          },
          {
            id: 'pay_2',
            type: 'capture',
            amount: 2500,
            currency: 'USD',
            status: 'succeeded',
            createdAt: '2024-01-20T15:02:00Z',
            transactionId: 'pi_3P1234567890'
          }
        ],
        items: [
          {
            id: 'item_1',
            productId: 'prod_1',
            sku: 'SLY-BLK-M',
            name: 'SLYTHERINE TEE BLACK',
            quantity: 1,
            unitPrice: 2500,
            totalPrice: 2500,
            selectedSize: 'M',
            selectedColor: 'Black',
            imageUrl: '/products/slytherinetee-black.png'
          }
        ],
        discounts: [],
        taxes: [
          {
            name: 'Sales Tax',
            rate: 0.08,
            amount: 200
          }
        ],
        shippingCost: 0,
        refunds: [],
        ownerNotes: [
          {
            id: 'note_1',
            content: 'Customer requested expedited shipping - upgraded for free',
            createdAt: '2024-01-20T15:30:00Z',
            updatedAt: '2024-01-20T15:30:00Z'
          }
        ],
        eventTimeline: [
          {
            id: 'event_1',
            type: 'created',
            description: 'Order created',
            timestamp: '2024-01-20T15:00:00Z'
          },
          {
            id: 'event_2',
            type: 'paid',
            description: 'Payment successful',
            timestamp: '2024-01-20T15:02:00Z'
          },
          {
            id: 'event_3',
            type: 'shipped',
            description: 'Order shipped via UPS',
            timestamp: '2024-01-21T10:00:00Z'
          }
        ],
        metadata: {
          source: 'web',
          userAgent: 'Mozilla/5.0...',
          ip: '192.168.1.1'
        },
        createdAt: '2024-01-20T15:00:00Z',
        updatedAt: '2024-01-21T10:00:00Z'
      },
      {
        id: 'order_2',
        orderNumber: 'ORD-2024-002',
        customerId: 'cust_2',
        customerEmail: 'jane.smith@example.com',
        customerName: 'Jane Smith',
        loginMethod: 'google',
        userId: 'user_2',
        accountCreatedAt: '2024-01-10T09:00:00Z',
        lastLoginAt: '2024-01-22T16:45:00Z',
        orderDate: '2024-01-22T17:00:00Z',
        orderTotal: 7500,
        currency: 'USD',
        status: 'processing',
        paymentStatus: 'paid',
        fulfillmentStatus: 'processing',
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          phone: '+1-555-0456'
        },
        shippingMethod: 'Express',
        carrier: 'FedEx',
        trackingNumbers: [],
        shipments: [],
        billingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          phone: '+1-555-0456'
        },
        paymentMethod: {
          type: 'paypal',
          wallet: 'jane.smith@example.com'
        },
        paymentProvider: 'paypal',
        transactionId: 'PAYPAL-12345',
        paymentTimeline: [
          {
            id: 'pay_3',
            type: 'capture',
            amount: 7500,
            currency: 'USD',
            status: 'succeeded',
            createdAt: '2024-01-22T17:01:00Z',
            transactionId: 'PAYPAL-12345'
          }
        ],
        items: [
          {
            id: 'item_2',
            productId: 'prod_2',
            sku: 'SLY-WHT-L',
            name: 'SLYTHERINE TEE WHITE',
            quantity: 2,
            unitPrice: 2500,
            totalPrice: 5000,
            selectedSize: 'L',
            selectedColor: 'White',
            imageUrl: '/products/slytherinetee-white.png'
          },
          {
            id: 'item_3',
            productId: 'prod_3',
            sku: 'ACC-BLK-OS',
            name: 'BRUTALIST CAP BLACK',
            quantity: 1,
            unitPrice: 2500,
            totalPrice: 2500,
            selectedSize: 'OS',
            selectedColor: 'Black',
            imageUrl: '/products/brutalistcap-black.png'
          }
        ],
        discounts: [
          {
            id: 'disc_1',
            code: 'WELCOME10',
            type: 'percentage',
            value: 10,
            description: 'Welcome discount - 10% off'
          }
        ],
        taxes: [
          {
            name: 'Sales Tax',
            rate: 0.0875,
            amount: 656
          }
        ],
        shippingCost: 1500,
        refunds: [],
        ownerNotes: [],
        eventTimeline: [
          {
            id: 'event_4',
            type: 'created',
            description: 'Order created',
            timestamp: '2024-01-22T17:00:00Z'
          },
          {
            id: 'event_5',
            type: 'paid',
            description: 'Payment successful via PayPal',
            timestamp: '2024-01-22T17:01:00Z'
          }
        ],
        metadata: {
          source: 'web',
          userAgent: 'Mozilla/5.0...',
          ip: '192.168.1.2'
        },
        createdAt: '2024-01-22T17:00:00Z',
        updatedAt: '2024-01-22T17:00:00Z'
      }
    ];
    this.saveToStorage();
  }

  // Public methods
  getAllOrders(): Order[] {
    return [...this.orders];
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.find(order => order.id === id);
  }

  addOrder(order: Order): void {
    this.orders.push(order);
    this.saveToStorage();
  }

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const index = this.orders.findIndex(order => order.id === id);
    if (index === -1) return null;

    const existingOrder = this.orders[index];
    if (!existingOrder) return null;

    this.orders[index] = { ...existingOrder, ...updates, updatedAt: new Date().toISOString() };
    this.saveToStorage();
    return this.orders[index];
  }

  deleteOrder(id: string): boolean {
    const index = this.orders.findIndex(order => order.id === id);
    if (index === -1) return false;

    this.orders.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Order management methods
  addOwnerNote(orderId: string, content: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const note = {
      id: `note_${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    order.ownerNotes.push(note);
    order.eventTimeline.push({
      id: `event_${Date.now()}`,
      type: 'note_added',
      description: 'Owner note added',
      timestamp: new Date().toISOString()
    });

    this.updateOrder(orderId, order);
    return order;
  }

  processRefund(orderId: string, amount: number, reason: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const refund = {
      id: `refund_${Date.now()}`,
      amount,
      reason,
      status: 'processed' as const,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };

    order.refunds.push(refund);
    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    order.eventTimeline.push({
      id: `event_${Date.now()}`,
      type: 'refunded',
      description: `Refund of $${(amount / 100).toFixed(2)} processed: ${reason}`,
      timestamp: new Date().toISOString()
    });

    this.updateOrder(orderId, order);
    return order;
  }

  updateFulfillment(orderId: string, status: Order['fulfillmentStatus'], trackingNumbers?: string[], carrier?: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.fulfillmentStatus = status;
    order.status = status === 'delivered' ? 'delivered' : status;
    
    if (trackingNumbers) {
      order.trackingNumbers = [...order.trackingNumbers, ...trackingNumbers];
    }
    
    if (carrier) {
      order.carrier = carrier;
    }

    order.eventTimeline.push({
      id: `event_${Date.now()}`,
      type: status === 'shipped' ? 'shipped' : status === 'delivered' ? 'delivered' : 'processing',
      description: `Order status updated to ${status}`,
      timestamp: new Date().toISOString()
    });

    this.updateOrder(orderId, order);
    return order;
  }

  // Search and filter methods
  searchOrders(query: string): Order[] {
    const lowerQuery = query.toLowerCase();
    return this.orders.filter(order =>
      order.orderNumber.toLowerCase().includes(lowerQuery) ||
      order.customerName.toLowerCase().includes(lowerQuery) ||
      order.customerEmail.toLowerCase().includes(lowerQuery)
    );
  }

  filterOrders(filters: {
    dateFrom?: string;
    dateTo?: string;
    paymentStatus?: string[];
    fulfillmentStatus?: string[];
    totalMin?: number;
    totalMax?: number;
  }): Order[] {
    return this.orders.filter(order => {
      if (filters.dateFrom && new Date(order.orderDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(order.orderDate) > new Date(filters.dateTo)) return false;
      if (filters.paymentStatus && filters.paymentStatus.length > 0 && !filters.paymentStatus.includes(order.paymentStatus)) return false;
      if (filters.fulfillmentStatus && filters.fulfillmentStatus.length > 0 && !filters.fulfillmentStatus.includes(order.fulfillmentStatus)) return false;
      if (filters.totalMin !== undefined && order.orderTotal < filters.totalMin) return false;
      if (filters.totalMax !== undefined && order.orderTotal > filters.totalMax) return false;
      return true;
    });
  }
}

// Singleton instance
export const ordersStore = new OrdersStore();
