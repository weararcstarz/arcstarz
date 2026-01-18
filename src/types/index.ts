export interface Product {
  id: string;
  name: string;
  price: number; // Now in dollars
  image: string;
  category: string;
  description?: string;
  fabric?: string;
  fit?: string;
  sizes: string[];
  colors?: string[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}
