import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@/types/orders';

const OWNER_ID = process.env.OWNER_ID || '1767942289962';

// Mock data - in production, this would be in a shared database
const mockOrders: Order[] = [
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
    taxes: [],
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
      }
    ],
    metadata: {
      source: 'web',
      userAgent: 'Mozilla/5.0...',
      ip: '192.168.1.1'
    },
    createdAt: '2024-01-20T15:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z'
  }
];

function verifyOwner(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const userId = request.headers.get('x-user-id');
  
  return userId === OWNER_ID || authHeader === `Bearer ${process.env.OWNER_TOKEN}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify owner access
    if (!verifyOwner(request)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const { id } = await params;
    
    // Find order
    const order = mockOrders.find(order => order.id === id);
    
    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify owner access
    if (!verifyOwner(request)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // Find order
    const orderIndex = mockOrders.findIndex(order => order.id === id);
    if (orderIndex === -1) {
      return new NextResponse('Order not found', { status: 404 });
    }

    const order = mockOrders[orderIndex];
    
    // Update order fields
    const updatedOrder = { ...order, ...body, updatedAt: new Date().toISOString() };
    mockOrders[orderIndex] = updatedOrder;

    // Log owner action
    console.log(`OWNER ACTION: Order ${id} updated`, {
      updatedFields: Object.keys(body),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Verify owner access
    if (!verifyOwner(request)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const { id } = await params;
    
    // Find order
    const orderIndex = mockOrders.findIndex(order => order.id === id);
    if (orderIndex === -1) {
      return new NextResponse('Order not found', { status: 404 });
    }

    // Remove order (soft delete by marking as cancelled)
    const order = mockOrders[orderIndex];
    if (order) {
      order.status = 'cancelled';
      order.fulfillmentStatus = 'cancelled';
      order.updatedAt = new Date().toISOString();

      // Add event to timeline
      order.eventTimeline.push({
        id: `event_${Date.now()}`,
        type: 'cancelled',
        description: 'Order cancelled by owner',
        timestamp: new Date().toISOString()
      });

      // Log owner action
      console.log(`OWNER ACTION: Order ${id} cancelled`, {
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ message: 'Order cancelled successfully' });
    } else {
      return new NextResponse('Order not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
