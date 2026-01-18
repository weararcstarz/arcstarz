import { NextRequest, NextResponse } from 'next/server';
import { OrdersListResponse, OrderFilters, Order } from '@/types/orders';

// OWNER_ID should be stored in environment variables for production
const OWNER_ID = process.env.OWNER_ID || '1767942289962'; // Replace with actual owner ID

// Mock data store - in production, this would be a database
let mockOrders: Order[] = [];

// Initialize empty - no placeholder data
if (mockOrders.length === 0) {
  // Don't create any placeholder orders
  // Orders will only be created when real users exist
}

// Owner verification middleware
function verifyOwner(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const userId = request.headers.get('x-user-id');
  
  // In production, verify against actual auth system
  // For now, check if the request includes owner credentials
  return userId === OWNER_ID || authHeader === `Bearer ${process.env.OWNER_TOKEN}`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify owner access
    if (!verifyOwner(request)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const paymentStatus = searchParams.get('paymentStatus')?.split(',');
    const fulfillmentStatus = searchParams.get('fulfillmentStatus')?.split(',');
    const totalMin = searchParams.get('totalMin') ? parseInt(searchParams.get('totalMin')!) : undefined;
    const totalMax = searchParams.get('totalMax') ? parseInt(searchParams.get('totalMax')!) : undefined;

    // Filter orders
    let filteredOrders = mockOrders.filter(order => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          order.customerEmail.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateFrom && new Date(order.orderDate) < new Date(dateFrom)) return false;
      if (dateTo && new Date(order.orderDate) > new Date(dateTo)) return false;

      // Payment status filter
      if (paymentStatus && paymentStatus.length > 0 && !paymentStatus.includes(order.paymentStatus)) {
        return false;
      }

      // Fulfillment status filter
      if (fulfillmentStatus && fulfillmentStatus.length > 0 && !fulfillmentStatus.includes(order.fulfillmentStatus)) {
        return false;
      }

      // Total range filter
      if (totalMin !== undefined && order.orderTotal < totalMin) return false;
      if (totalMax !== undefined && order.orderTotal > totalMax) return false;

      return true;
    });

    // Sort orders (default by date descending)
    const sortBy = searchParams.get('sortBy') || 'orderDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    filteredOrders.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'orderDate':
          comparison = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
          break;
        case 'orderTotal':
          comparison = a.orderTotal - b.orderTotal;
          break;
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + limit);

    const response: OrdersListResponse = {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify owner access
    if (!verifyOwner(request)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const body = await request.json();
    
    // Handle different POST actions based on body.type
    switch (body.type) {
      case 'refund':
        return handleRefund(body);
      case 'update_fulfillment':
        return handleUpdateFulfillment(body);
      case 'add_note':
        return handleAddNote(body);
      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing order action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleRefund(body: any) {
  const { orderId, amount, reason, itemIds } = body;
  
  // Find order
  const orderIndex = mockOrders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  const order = mockOrders[orderIndex];
  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }
  
  // Create refund record
  const refund = {
    id: `refund_${Date.now()}`,
    amount,
    reason,
    status: 'processed' as const,
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    items: itemIds
  };

  // Update order
  order.refunds.push(refund);
  order.paymentStatus = 'refunded';
  order.status = 'refunded';
  order.updatedAt = new Date().toISOString();

  // Add event to timeline
  order.eventTimeline.push({
    id: `event_${Date.now()}`,
    type: 'refunded',
    description: `Refund of $${(amount / 100).toFixed(2)} processed: ${reason}`,
    timestamp: new Date().toISOString()
  });

  // Log owner action
  console.log(`OWNER ACTION: Refund processed for order ${orderId}`, {
    amount,
    reason,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({ order, refund });
}

async function handleUpdateFulfillment(body: any) {
  const { orderId, status, trackingNumbers, carrier, shipments } = body;
  
  // Find order
  const orderIndex = mockOrders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  const order = mockOrders[orderIndex];
  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }
  
  // Update fulfillment
  order.fulfillmentStatus = status;
  order.status = status === 'delivered' ? 'delivered' : status;
  
  if (trackingNumbers) {
    order.trackingNumbers = [...(order.trackingNumbers || []), ...trackingNumbers];
  }
  
  if (carrier) {
    order.carrier = carrier;
  }

  if (shipments) {
    shipments.forEach((shipment: any) => {
      const existingIndex = (order.shipments || []).findIndex(s => s.id === shipment.id);
      if (existingIndex >= 0) {
        const existingShipment = order.shipments?.[existingIndex];
        if (existingShipment) {
          order.shipments![existingIndex] = { ...existingShipment, ...shipment };
        }
      } else {
        if (!order.shipments) order.shipments = [];
        order.shipments.push({
          id: shipment.id || `ship_${Date.now()}`,
          trackingNumber: shipment.trackingNumber || '',
          carrier: shipment.carrier || order.carrier || 'Unknown',
          status: shipment.status || 'shipped',
          shippedAt: shipment.shippedAt || new Date().toISOString(),
          items: shipment.items || []
        });
      }
    });
  }

  order.updatedAt = new Date().toISOString();

  // Add event to timeline
  if (!order.eventTimeline) order.eventTimeline = [];
  order.eventTimeline.push({
    id: `event_${Date.now()}`,
    type: status === 'shipped' ? 'shipped' : status === 'delivered' ? 'delivered' : 'processing',
    description: `Order status updated to ${status}`,
    timestamp: new Date().toISOString()
  });

  // Log owner action
  console.log(`OWNER ACTION: Fulfillment updated for order ${orderId}`, {
    status,
    trackingNumbers,
    carrier,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({ order });
}

async function handleAddNote(body: any) {
  const { orderId, content } = body;
  
  // Find order
  const orderIndex = mockOrders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  const order = mockOrders[orderIndex];
  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }
  
  // Add owner note
  const note = {
    id: `note_${Date.now()}`,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!order.ownerNotes) order.ownerNotes = [];
  order.ownerNotes.push(note);
  order.updatedAt = new Date().toISOString();

  // Add event to timeline
  if (!order.eventTimeline) order.eventTimeline = [];
  order.eventTimeline.push({
    id: `event_${Date.now()}`,
    type: 'note_added',
    description: 'Owner note added to order',
    timestamp: new Date().toISOString()
  });

  // Log owner action
  console.log(`OWNER ACTION: Note added to order ${orderId}`, {
    content: content.substring(0, 50) + '...',
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({ order, note });
}
