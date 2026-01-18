'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import { products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { usePerfectCurrency } from '@/contexts/PerfectCurrencyContext';
import Image from 'next/image';
import Link from 'next/link';

export default function Product() {
  const params = useParams();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart, cartItems, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const { formatPrice } = usePerfectCurrency();
  
  const product = products.find(p => p.id === params.id);
  
  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="font-body text-sm">Product not found</p>
        </div>
      </div>
    );
  }

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    
    const cartItem = {
      ...product,
      quantity,
      selectedSize,
      selectedColor: selectedColor || undefined
    };
    
    addToCart(cartItem);
    // Don't automatically open cart - let user decide when to view cart
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20">
      <Navbar />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        total={cartTotal}
      />

      {/* Product Section */}
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] bg-[#F5F5F0]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div>
                <h1 className="font-headline text-2xl md:text-3xl tracking-tight mb-4">
                  {product.name}
                </h1>
                <p className="font-headline text-xl tracking-tight">
                  {formatPrice(product.price)}
                </p>
              </div>

              {product.description && (
                <p className="font-body text-sm text-[#1C1C1C] leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Size Selector */}
              <div>
                <label className="font-headline text-sm tracking-tight block mb-4">
                  SIZE
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, index) => (
                    <button
                      key={`size-${size}-${index}`}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-sm font-body uppercase tracking-wide transition-colors ${
                        selectedSize === size
                          ? 'bg-[#0A0A0A] text-[#F5F5F0]'
                          : 'border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F5F5F0]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              {product.colors && product.colors.length > 1 && (
                <div>
                  <label className="font-headline text-sm tracking-tight block mb-4">
                    COLOR
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, index) => (
                      <button
                        key={`color-${color}-${index}`}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 text-sm font-body uppercase tracking-wide transition-colors ${
                          selectedColor === color
                            ? 'bg-[#0A0A0A] text-[#F5F5F0]'
                            : 'border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F5F5F0]'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="font-headline text-sm tracking-tight block mb-4">
                  QUANTITY
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-[#0A0A0A] flex items-center justify-center hover:bg-[#0A0A0A] hover:text-[#F5F5F0] transition-colors"
                  >
                    -
                  </button>
                  <span className="font-body text-sm w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-[#0A0A0A] flex items-center justify-center hover:bg-[#0A0A0A] hover:text-[#F5F5F0] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize}
                className={`btn-primary w-full text-lg py-4 ${
                  !selectedSize ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {selectedSize ? 'ADD TO CART' : 'SELECT SIZE'}
              </button>

              {/* Product Details */}
              <div className="space-y-4 pt-8 border-t border-[#0A0A0A]">
                <div>
                  <h3 className="font-headline text-sm tracking-tight mb-2">FABRIC</h3>
                  <p className="font-body text-sm text-[#1C1C1C]">
                    {product.fabric || 'Premium materials'}
                  </p>
                </div>
                <div>
                  <h3 className="font-headline text-sm tracking-tight mb-2">FIT</h3>
                  <p className="font-body text-sm text-[#1C1C1C]">
                    {product.fit || 'Standard fit'}
                  </p>
                </div>
                <div>
                  <h3 className="font-headline text-sm tracking-tight mb-2">SHIPPING</h3>
                  <p className="font-body text-sm text-[#1C1C1C]">
                    Free shipping on orders over $200
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="px-4 py-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-2xl tracking-tight mb-12 text-center">
              RELATED PIECES
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedProducts.map((relatedProduct, index) => (
                <Link key={`${relatedProduct.id}-${index}`} href={`/product/${relatedProduct.id}`} className="block group">
                  <div className="relative overflow-hidden">
                    <div className="relative aspect-[3/4] bg-[#F5F5F0]">
                      <Image
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="mt-4">
                      <h3 className="font-headline text-sm tracking-tight">
                        {relatedProduct.name}
                      </h3>
                      <p className="font-body text-sm text-[#1C1C1C]">
                        ${relatedProduct.price}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
