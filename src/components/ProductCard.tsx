'use client';

import { useState } from 'react';
import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { usePerfectCurrency } from '@/contexts/PerfectCurrencyContext';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { trackProductView, trackAddToCart } from '@/services/connectedSystem';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { formatPrice } = usePerfectCurrency();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Check if it's a Coreline product
  const isCorelineProduct = product.name.includes('CORELINE');

  const handleProductClick = () => {
    // Track product view
    trackProductView(product.id, user?.id);
    
    router.push(`/shop/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Track add to cart
    trackAddToCart(product.id, user?.id);
    
    // Add to cart
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      selectedSize: 'M', // Default size
      image: product.image,
      category: product.category,
      sizes: ['XS', 'S', 'M', 'L', 'XL'] // Default sizes
    };
    
    addToCart(cartItem);
    
    // Show feedback
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          message: `${product.name} added to cart!`,
          type: 'success'
        }
      }));
    }
  };

  return (
    <div 
      className="group cursor-pointer"
      onClick={handleProductClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Transparent Product Card */}
      <div className="relative overflow-hidden">
        {/* Product Image - Full transparent background */}
        <div className="relative aspect-[3/4] sm:aspect-[2/3] bg-transparent">
          {isImageLoading && (
            <div className="absolute inset-0 bg-gray-100/50 animate-pulse" />
          )}
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-contain transition-all duration-700 ease-out group-hover:scale-105 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
            style={{ objectFit: 'contain' }}
            onLoad={() => setIsImageLoading(false)}
          />
          
          {/* Product Name - Plain text */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 transition-all duration-300 ease-out">
            <p className="font-body text-black text-xs sm:text-sm tracking-wide font-normal">
              {product.name}
            </p>
          </div>
          
          {/* Hover Overlay - Shows on hover */}
          <div 
            className={`absolute inset-0 bg-black/10 transition-all duration-300 ease-out ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
