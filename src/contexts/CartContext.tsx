'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { trackAddToCart, trackProductView, connectedSystem } from '@/services/connectedSystem';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string, selectedSize: string) => void;
  updateQuantity: (itemId: string, selectedSize: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Load cart from localStorage on mount (only if user is logged in)
  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(`arcstarz_cart_${user.id}`);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          localStorage.removeItem(`arcstarz_cart_${user.id}`);
        }
      }
    } else {
      setCartItems([]);
    }
  }, [user]);

  // Save cart to localStorage whenever it changes (only if user is logged in)
  useEffect(() => {
    if (user) {
      localStorage.setItem(`arcstarz_cart_${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = (item: CartItem) => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login page
      router.push('/login');
      return;
    }

    // Track add to cart event
    trackAddToCart(item.id, user.id);

    setCartItems(prevItems => {
      // Check if item with same size already exists
      const existingItemIndex = prevItems.findIndex(
        existingItem => existingItem.id === item.id && existingItem.selectedSize === item.selectedSize
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        if (existingItem) {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            selectedSize: existingItem.selectedSize || '',
            selectedColor: existingItem.selectedColor || '',
            quantity: existingItem.quantity + item.quantity
          };
        }
        
        // Track cart update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
              action: 'quantity_updated',
              item: updatedItems[existingItemIndex],
              userId: user.id,
              timestamp: new Date().toISOString()
            }
          }));
        }
        
        return updatedItems;
      } else {
        // Add new item
        const newItems = [...prevItems, item];
        
        // Track cart update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
              action: 'item_added',
              item: item,
              userId: user.id,
              timestamp: new Date().toISOString()
            }
          }));
        }
        
        return newItems;
      }
    });
  };

  const removeFromCart = (itemId: string, selectedSize: string) => {
    const removedItem = cartItems.find(item => item.id === itemId && item.selectedSize === selectedSize);
    
    setCartItems(prevItems => 
      prevItems.filter(item => !(item.id === itemId && item.selectedSize === selectedSize))
    );
    
    // Track cart removal event
    if (removedItem && user && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: {
          action: 'item_removed',
          item: removedItem,
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const updateQuantity = (itemId: string, selectedSize: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId, selectedSize);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId && item.selectedSize === selectedSize
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      isCartOpen,
      setIsCartOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
