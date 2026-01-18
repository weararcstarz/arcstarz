// Common TypeScript interfaces used across the application

export interface ShippingDetails {
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
}

export interface SessionData {
  savedUser: any | null;
  savedSession: any | null;
  rawUser: string | null;
  rawSession: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  registrationType: string;
  registrationSource: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  isOwner: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize: string;
  image: string;
  category: string;
}

export interface CurrencyStats {
  count: number;
  total: number;
  percentage: number;
}

export interface CurrencyStatsRecord {
  [currency: string]: CurrencyStats;
}
