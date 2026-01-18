export interface Order {
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
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderStatus: 'confirmed' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
