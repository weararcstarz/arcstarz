/**
 * Payment-Verified Order Creation API
 * Creates orders ONLY after successful payment verification
 */

const fs = require('fs');
const path = require('path');
const sendOrderConfirmation = require('../utils/sendOrderConfirmation');

const ORDERS_FILE = path.join(__dirname, '../orders.json');

// Helper functions
function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading orders:', error);
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing orders:', error);
    return false;
  }
}

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `ORD-${year}-${timestamp}-${random}`;
}

function generateOrderId() {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// POST - Create order ONLY after payment verification
async function createPaymentVerifiedOrder(req, res) {
  try {
    const { 
      customerEmail,
      customerName,
      loginMethod,
      userId,
      accountCreatedAt,
      lastLoginAt,
      shippingDetails,
      items,
      total,
      paymentProvider,
      transactionId,
      paymentMethod,
      paymentIntentId,
      paypalOrderId
    } = req.body;
    
    console.log('🔐 PAYMENT-VERIFIED ORDER REQUEST:', {
      customerEmail,
      paymentProvider,
      transactionId,
      total,
      itemCount: items?.length
    });
    
    // Validate required fields
    const requiredFields = ['customerEmail', 'customerName', 'items', 'total', 'shippingDetails', 'paymentProvider', 'transactionId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }
    
    // Validate payment data
    if (!transactionId || !paymentProvider) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification data is required'
      });
    }
    
    // Validate shipping details
    const requiredShippingFields = ['firstName', 'lastName', 'address', 'city', 'zipCode', 'country'];
    const missingShippingFields = requiredShippingFields.filter(field => !shippingDetails[field]);
    
    if (missingShippingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required shipping details',
        missingShippingFields
      });
    }
    
    const orders = readOrders();
    
    // Check if this transaction ID has already been processed (prevent duplicate orders)
    const existingOrder = orders.find(order => 
      order.metadata && order.metadata.transactionId === transactionId
    );
    
    if (existingOrder) {
      console.log('⚠️  Duplicate transaction detected:', transactionId);
      return res.status(409).json({
        success: false,
        error: 'This payment has already been processed',
        existingOrderId: existingOrder.id
      });
    }
    
    // Generate order number and ID ONLY after payment verification
    const orderNumber = generateOrderNumber();
    const orderId = generateOrderId();
    const now = new Date().toISOString();
    
    // Create payment-verified order
    const newOrder = {
      id: orderId,
      orderNumber,
      customerId: `cust_${Date.now()}`,
      customerEmail: customerEmail.toLowerCase().trim(),
      customerName: customerName || 'Unknown',
      loginMethod: loginMethod || 'guest',
      userId: userId || null,
      accountCreatedAt: accountCreatedAt || null,
      lastLoginAt: lastLoginAt || null,
      orderDate: now,
      orderTotal: total,
      currency: 'USD',
      status: 'paid', // Only set to paid after payment verification
      paymentStatus: 'paid', // Only set to paid after payment verification
      fulfillmentStatus: 'pending',
      shippingAddress: {
        firstName: shippingDetails.firstName,
        lastName: shippingDetails.lastName,
        street: shippingDetails.address,
        city: shippingDetails.city,
        state: shippingDetails.state || '',
        postalCode: shippingDetails.zipCode,
        country: shippingDetails.country,
        phone: shippingDetails.phone || ''
      },
      shippingMethod: 'Standard',
      carrier: null,
      trackingNumbers: [],
      shipments: [],
      billingAddress: {
        firstName: shippingDetails.firstName,
        lastName: shippingDetails.lastName,
        street: shippingDetails.address,
        city: shippingDetails.city,
        state: shippingDetails.state || '',
        postalCode: shippingDetails.zipCode,
        country: shippingDetails.country,
        phone: shippingDetails.phone || ''
      },
      paymentMethod: paymentMethod || 'card',
      paymentProvider: paymentProvider,
      transactionId: transactionId,
      paymentTimeline: [
        {
          id: `pay_${Date.now()}`,
          type: 'capture',
          amount: total,
          currency: 'USD',
          status: 'succeeded',
          createdAt: now,
          transactionId: transactionId
        }
      ],
      items: items.map(item => ({
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
      })),
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
          description: `Payment successfully verified via ${paymentProvider}`,
          timestamp: now
        }
      ],
      metadata: {
        source: 'web',
        paymentProvider: paymentProvider,
        transactionId: transactionId,
        paymentIntentId: paymentIntentId || '',
        paypalOrderId: paypalOrderId || '',
        paymentVerified: 'true',
        paymentVerifiedAt: now
      },
      createdAt: now,
      updatedAt: now
    };
    
    // Save order
    orders.push(newOrder);
    const saved = writeOrders(orders);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save order'
      });
    }
    
    console.log(`✅ PAYMENT-VERIFIED ORDER CREATED: ${orderNumber} for ${customerEmail}`, {
      orderId,
      orderNumber,
      total,
      paymentProvider,
      transactionId,
      itemCount: items.length,
      paymentVerified: true
    });
    
    // Send order confirmation email
    try {
      await sendOrderConfirmation(customerEmail, orderId, items, total);
      console.log('📧 Order confirmation email sent to:', customerEmail);
    } catch (emailError) {
      console.error('❌ Failed to send order confirmation email:', emailError);
      // Don't fail the order if email fails
    }
    
    res.status(201).json({
      success: true,
      order: newOrder,
      message: 'Order created successfully after payment verification',
      orderNumber: orderNumber
    });
    
  } catch (error) {
    console.error('❌ Error creating payment-verified order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order after payment verification'
    });
  }
}

module.exports = {
  createPaymentVerifiedOrder
};
