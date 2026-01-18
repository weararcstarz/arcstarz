'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePerfectCurrency } from '@/contexts/PerfectCurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptGenerator } from '@/utils/receiptGenerator';
import ReceiptViewer from '@/components/ReceiptViewer';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KWD' | 'BHD' | 'OMR' | 'JOD' | 'AED' | 'KES' | 'ZAR' | 'NGN' | 'EGP' | 'GHS' | 'MAD' | 'TZS' | 'UGX';

const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || '1767942289962';
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'bashirali652@icloud.com';
const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  : 'http://localhost:3001';

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize: string;
    image: string;
  }>;
  total: number;
  currency: string;
  shippingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    addressLine2: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    deliveryInstructions: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderStatus: 'confirmed' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const { formatPrice, calculateRevenue, getCurrencyStats, currencies } = usePerfectCurrency();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');
  const [revenueStats, setRevenueStats] = useState<{ total: number; byCurrency: Record<string, number> }>({ total: 0, byCurrency: {} });

  // Check if user is owner
  const isOwner = user?.id === OWNER_ID || user?.email === OWNER_EMAIL;

  // Receipt functions
  const openReceiptViewer = (order: Order) => {
    setReceiptOrder(order);
    setShowReceipt(true);
  };

  const closeReceiptViewer = () => {
    setShowReceipt(false);
    setReceiptOrder(null);
  };

  useEffect(() => {
    // Wait for auth to load before checking ownership
    if (authLoading) return;
    
    if (!isOwner) {
      router.push('/404');
      return;
    }
    fetchOrders();
  }, [isOwner, router, authLoading]);

  useEffect(() => {
    calculateRevenueStats();
  }, [orders, displayCurrency]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/orders`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data.orders || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenueStats = async () => {
    if (orders.length === 0) return;

    try {
      const totalRevenue = await calculateRevenue(orders, displayCurrency);
      const stats = getCurrencyStats(orders);
      
      setRevenueStats({
        total: totalRevenue,
        byCurrency: Object.keys(stats).reduce((acc, currency) => {
          acc[currency] = (stats[currency] as any)?.total || 0;
          return acc;
        }, {} as Record<string, number>)
      });
    } catch (error) {
      console.error('Error calculating revenue stats:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, updates: {
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
    fulfillmentStatus?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    orderStatus?: 'confirmed' | 'processing' | 'completed' | 'cancelled';
  }) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      const data = await response.json();
      
      // Update local state with proper typing
      const updatedOrder = orders.find(order => order.id === orderId);
      if (updatedOrder) {
        const newOrderData = { 
          ...updatedOrder, 
          ...updates, 
          updatedAt: new Date().toISOString() 
        } as Order;
        
        setOrders(prev => prev.map(order => 
          order.id === orderId ? newOrderData : order
        ));

        // Generate receipt if order is marked as shipped
        if (updates.fulfillmentStatus === 'shipped') {
          console.log('🚚 Order shipped - opening receipt viewer...');
          
          // Show confirmation dialog
          const shouldViewReceipt = confirm(
            `Order ${orderId} has been marked as shipped!\n\nWould you like to view the receipt now?`
          );
          
          if (shouldViewReceipt) {
            openReceiptViewer(newOrderData);
          }
        }

        // Update selected order if it's currently displayed
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { 
            ...prev, 
            ...updates, 
            updatedAt: new Date().toISOString() 
          } as Order : null);
        }
      }

      console.log('Order updated successfully:', data.order);
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Failed to update order');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      // Remove from local state
      setOrders(prev => prev.filter(order => order.id !== orderId));
      
      // Close detail view if this order was selected
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
        setShowOrderDetail(false);
      }

      console.log('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      setError('Failed to delete order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
      case 'processing':
      case 'confirmed':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'shipped':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  
  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-black border-t-transparent mb-4"></div>
            <p className="font-body text-sm md:text-base text-black">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="font-headline text-2xl md:text-4xl tracking-tight mb-2 md:mb-4 text-black">
              ORDERS MANAGEMENT
            </h1>
            <p className="font-body text-xs md:text-sm tracking-wide text-black/60">
              Customer orders & fulfillment
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center mt-4 md:mt-6 gap-3 md:gap-4">
              <button
                onClick={fetchOrders}
                className="bg-black text-white px-6 py-3 text-sm font-body font-medium hover:bg-gray-800 transition-all"
              >
                🔄 Refresh Orders
              </button>
              <span className="inline-flex items-center px-4 py-2 bg-black/5 text-black font-body text-xs">
                Last updated: {formatDate(lastUpdated.toISOString())}
              </span>
            </div>
          </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="bg-white border border-black/10 p-4 md:p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline text-xl md:text-2xl tracking-tight text-black">
                {formatPrice(revenueStats.total, displayCurrency)}
              </h3>
              <span className="text-xl md:text-2xl">💰</span>
            </div>
            <p className="font-body text-xs md:text-sm text-black/60">Total Revenue</p>
            <p className="font-body text-xs text-black/40 mt-1">({displayCurrency})</p>
          </div>
          <div className="bg-white border border-black/10 p-4 md:p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline text-xl md:text-2xl tracking-tight text-black">{orders.length}</h3>
              <span className="text-xl md:text-2xl">📦</span>
            </div>
            <p className="font-body text-xs md:text-sm text-black/60">Total Orders</p>
            <p className="font-body text-xs text-black/40 mt-1">All time</p>
          </div>
          <div className="bg-white border border-black/10 p-4 md:p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline text-xl md:text-2xl tracking-tight text-black">
                {orders.filter(o => o.paymentStatus === 'paid').length}
              </h3>
              <span className="text-xl md:text-2xl">✅</span>
            </div>
            <p className="font-body text-xs md:text-sm text-black/60">Paid Orders</p>
            <p className="font-body text-xs text-black/40 mt-1">Completed payments</p>
          </div>
          <div className="bg-white border border-black/10 p-4 md:p-6 hover:shadow-lg transition-all">
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
              className="bg-white border border-black/20 px-3 py-2 text-sm font-body w-full mb-2 text-black"
            >
              {Object.keys(currencies).map(currency => (
                <option key={currency} value={currency} className="bg-white">
                  {currency}
                </option>
              ))}
            </select>
            <p className="font-body text-xs md:text-sm text-black/60">Display Currency</p>
            <p className="font-body text-xs text-black/40 mt-1">Conversion view</p>
          </div>
        </div>

        {/* Currency Breakdown */}
        {Object.keys(revenueStats.byCurrency).length > 0 && (
          <div className="mb-8 md:mb-12 bg-white border border-black/10 p-4 md:p-6">
            <h3 className="font-body text-sm md:text-base tracking-tight mb-4 md:mb-6 text-center text-black font-medium">💵 Revenue by Currency</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Object.entries(revenueStats.byCurrency).map(([currency, amount]) => (
                <div key={currency} className="text-center border border-black/10 p-3 md:p-4">
                  <p className="font-headline text-base md:text-lg tracking-tight mb-2 text-black">
                    {formatPrice(amount, currency)}
                  </p>
                  <p className="font-body text-xs md:text-sm text-black/60">{currency}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 border-2 border-red-600 bg-red-50">
            <p className="font-body text-sm text-red-600 font-semibold">
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12 md:py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-black border-t-transparent mb-4"></div>
            <p className="font-body text-sm md:text-base text-black">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 md:py-20 border border-black/10 bg-white">
            <div className="text-4xl md:text-6xl mb-4">📦</div>
            <h3 className="font-headline text-xl md:text-2xl tracking-tight mb-4 text-black">No Orders Yet</h3>
            <p className="font-body text-sm md:text-base text-black/60 mb-6">
              When customers place orders, they will appear here.
            </p>
            <button
              onClick={fetchOrders}
              className="bg-black text-white px-6 py-3 text-sm font-body font-medium hover:bg-gray-800 transition-all"
            >
              Refresh Orders
            </button>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-4 md:space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-black/10 bg-white hover:shadow-lg transition-all duration-300"
              >
                {/* Order Header */}
                <div className="p-4 md:p-6 border-b border-black/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2 flex-wrap gap-2">
                        <h3 className="font-headline text-sm md:text-lg tracking-tight">
                          {order.id}
                        </h3>
                        <span className={`px-3 py-1 text-xs font-bold border-2 rounded-full ${getStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-body text-sm md:text-base text-black font-medium">
                          👤 {order.userName}
                        </p>
                        <p className="font-body text-xs md:text-sm text-black/60">
                          📧 {order.userEmail}
                        </p>
                        {order.userPhone && (
                          <p className="font-body text-xs md:text-sm text-black/60">
                            📱 {order.userPhone}
                          </p>
                        )}
                        <div className="font-body text-xs text-black mt-1 p-2 bg-gray-50 border border-black/10">
                          <div className="font-medium text-black">🚚 Shipping:</div>
                          <div className="text-black/70">{order.shippingDetails.address}</div>
                          {order.shippingDetails.addressLine2 && <div className="text-black/70">{order.shippingDetails.addressLine2}</div>}
                          {order.shippingDetails.apartment && <div className="text-black/70">{order.shippingDetails.apartment}</div>}
                          <div className="text-black/70">{order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}</div>
                          <div className="text-black/70">{order.shippingDetails.country}</div>
                          {order.shippingDetails.deliveryInstructions && (
                            <div className="mt-1 italic text-black/60">📝 {order.shippingDetails.deliveryInstructions}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-headline text-lg md:text-xl tracking-tight mb-2 text-black">
                        {formatPrice(order.total, order.currency)}
                      </p>
                      <p className="font-body text-xs text-black/60 bg-gray-50 px-2 py-1 inline-block">
                        📅 {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 md:p-6 border-b border-black/10">
                  <h4 className="font-body text-sm md:text-base tracking-tight mb-3 md:mb-4 text-black font-medium">📦 Order Items</h4>
                  <div className="space-y-2 md:space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 md:p-3 border border-black/10">
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="font-headline text-sm md:text-base text-black">{item.quantity}x</span>
                          <div>
                            <p className="font-body text-xs md:text-sm font-medium text-black">{item.name}</p>
                            <p className="font-body text-xs text-black/60">Size: {item.selectedSize}</p>
                          </div>
                        </div>
                        <span className="font-headline text-sm md:text-base text-black">
                          {formatPrice(item.price * item.quantity, order.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 md:px-3 py-1 text-xs font-bold border rounded-full ${getStatusColor(order.fulfillmentStatus)} ${order.fulfillmentStatus === 'shipped' ? 'ring-2 ring-green-300 ring-offset-1' : ''}`}>
                        🚚 {order.fulfillmentStatus.toUpperCase()}
                        {order.fulfillmentStatus === 'shipped' && ' 🧾'}
                      </span>
                      <span className={`px-2 md:px-3 py-1 text-xs font-bold border rounded-full ${getStatusColor(order.orderStatus)}`}>
                        📋 {order.orderStatus.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetail(true);
                        }}
                        className="px-3 md:px-4 py-2 bg-black text-white text-xs md:text-sm font-body font-medium hover:bg-gray-800 transition-all"
                      >
                        👁️ View
                      </button>
                      
                      {/* Shipped Receipt Button - Only shows when order is shipped */}
                      {order.fulfillmentStatus === 'shipped' && (
                        <button
                          onClick={() => openReceiptViewer(order)}
                          className="px-3 py-2 bg-green-600 text-white text-sm font-body hover:bg-green-700 transition-colors border-2 border-green-600 flex items-center gap-1"
                        >
                          🧾 View Receipt
                        </button>
                      )}
                      
                      {/* Quick Status Updates */}
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => updateOrderStatus(order.id, { paymentStatus: e.target.value as 'pending' | 'paid' | 'failed' | 'refunded' })}
                        className="px-2 md:px-3 py-2 text-xs md:text-sm border border-black/20 font-body bg-white"
                      >
                        <option value="pending">💳 Pending</option>
                        <option value="paid">✅ Paid</option>
                        <option value="failed">❌ Failed</option>
                        <option value="refunded">💰 Refunded</option>
                      </select>
                      
                      <select
                        value={order.fulfillmentStatus}
                        onChange={(e) => updateOrderStatus(order.id, { fulfillmentStatus: e.target.value as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' })}
                        className="px-2 md:px-3 py-2 text-xs md:text-sm border border-black/20 font-body bg-white"
                      >
                        <option value="pending">📦 Pending</option>
                        <option value="processing">⚙️ Processing</option>
                        <option value="shipped">🚚 Shipped</option>
                        <option value="delivered">✅ Delivered</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                      
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="px-3 py-2 bg-red-600 text-white text-xs md:text-sm font-body hover:bg-red-700 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-[#0A0A0A] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-xl tracking-tight">
                  Order {selectedOrder.id}
                </h2>
                <button
                  onClick={() => {
                    setShowOrderDetail(false);
                    setSelectedOrder(null);
                  }}
                  className="text-[#1C1C1C] hover:text-[#0A0A0A]"
                >
                  ✕
                </button>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-headline text-lg tracking-tight mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-body"><strong>Name:</strong> {selectedOrder.userName}</p>
                  <p className="font-body"><strong>Email:</strong> {selectedOrder.userEmail}</p>
                  {selectedOrder.userPhone && (
                    <p className="font-body"><strong>Phone:</strong> {selectedOrder.userPhone}</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-6">
                <h3 className="font-headline text-lg tracking-tight mb-2">🚚 Shipping Address</h3>
                <div className="bg-[#F5F5F0] border-2 border-[#0A0A0A] p-4 space-y-2 text-sm">
                  <div className="font-body">
                    <strong className="text-[#0A0A0A]">Recipient:</strong><br/>
                    {selectedOrder.shippingDetails.firstName} {selectedOrder.shippingDetails.lastName}
                  </div>
                  
                  <div className="font-body">
                    <strong className="text-[#0A0A0A]">Address Line 1:</strong><br/>
                    {selectedOrder.shippingDetails.address}
                  </div>
                  
                  {selectedOrder.shippingDetails.addressLine2 && (
                    <div className="font-body">
                      <strong className="text-[#0A0A0A]">Address Line 2:</strong><br/>
                      {selectedOrder.shippingDetails.addressLine2}
                    </div>
                  )}
                  
                  {selectedOrder.shippingDetails.apartment && (
                    <div className="font-body">
                      <strong className="text-[#0A0A0A]">Apartment/Suite/Unit:</strong><br/>
                      {selectedOrder.shippingDetails.apartment}
                    </div>
                  )}
                  
                  <div className="font-body">
                    <strong className="text-[#0A0A0A]">City/State/ZIP:</strong><br/>
                    {selectedOrder.shippingDetails.city}, {selectedOrder.shippingDetails.state} {selectedOrder.shippingDetails.zipCode}
                  </div>
                  
                  <div className="font-body">
                    <strong className="text-[#0A0A0A]">Country:</strong><br/>
                    {selectedOrder.shippingDetails.country}
                  </div>
                  
                  <div className="font-body">
                    <strong className="text-[#0A0A0A]">Phone:</strong><br/>
                    📱 {selectedOrder.shippingDetails.phone}
                  </div>
                  
                  {selectedOrder.shippingDetails.deliveryInstructions && (
                    <div className="font-body bg-white border border-[#0A0A0A] border-opacity-20 p-3 mt-3">
                      <strong className="text-[#0A0A0A]">📝 Delivery Instructions:</strong><br/>
                      <span className="text-[#1C1C1C] italic">{selectedOrder.shippingDetails.deliveryInstructions}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-headline text-lg tracking-tight mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-body text-sm font-semibold">{item.name}</p>
                        <p className="font-body text-xs text-[#1C1C1C]">
                          Size: {item.selectedSize} • Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-body text-sm">
                        {formatPrice(item.price * item.quantity, selectedOrder.currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-2 border-t">
                  <div className="flex justify-between">
                    <p className="font-body text-sm font-semibold">Total:</p>
                    <p className="font-headline text-lg tracking-tight">
                      {formatPrice(selectedOrder.total, selectedOrder.currency)}
                    </p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="font-body text-xs text-[#1C1C1C]">Converted to {displayCurrency}:</p>
                    <p className="font-body text-sm">
                      {formatPrice(selectedOrder.total, displayCurrency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div className="mb-6">
                <h3 className="font-headline text-lg tracking-tight mb-2">Order Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">Payment Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold border rounded ${getStatusColor(selectedOrder.paymentStatus)}`}>
                      {selectedOrder.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">Fulfillment Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold border rounded ${getStatusColor(selectedOrder.fulfillmentStatus)}`}>
                      {selectedOrder.fulfillmentStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">Order Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold border rounded ${getStatusColor(selectedOrder.orderStatus)}`}>
                      {selectedOrder.orderStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt Actions */}
              <div className="mb-6">
                <h3 className="font-headline text-lg tracking-tight mb-2">Receipt Actions</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openReceiptViewer(selectedOrder)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-body hover:bg-green-700 transition-colors border-2 border-green-600"
                  >
                    📄 View Receipt
                  </button>
                  <button
                    onClick={() => ReceiptGenerator.generateAndDownloadReceipt(selectedOrder)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-body hover:bg-blue-700 transition-colors border-2 border-blue-600"
                  >
                    💾 Download Receipt
                  </button>
                  {selectedOrder.fulfillmentStatus === 'shipped' && (
                    <span className="px-3 py-2 bg-green-100 text-green-800 text-xs font-semibold border border-green-300 rounded">
                      ✅ Receipt Generated
                    </span>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-[#1C1C1C] space-y-1">
                <p>Created: {formatDate(selectedOrder.createdAt)}</p>
                <p>Updated: {formatDate(selectedOrder.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      <ReceiptViewer
        order={receiptOrder}
        isOpen={showReceipt}
        onClose={closeReceiptViewer}
      />

      <Footer />
    </div>
  );
}
