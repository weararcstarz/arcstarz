'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { usePerfectCurrency } from '@/contexts/PerfectCurrencyContext';
import Link from 'next/link';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { addToCart, setIsCartOpen, cartItems, cartTotal, isCartOpen } = useCart();
  const { formatPrice } = usePerfectCurrency();
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Unwrap the params Promise
  const resolvedParams = use(params);

  // Find the product
  const product = products.find(p => p.id === resolvedParams.id);

  if (!product) {
    notFound();
  }

  const availableSizes = product.sizes || ['XS', 'S', 'M', 'L', 'XL'];
  const maxQuantity = 10;
  
  // Product shoots gallery - add multiple images for products
  const productImages = [
    product.image,
    // Add product shoot images if they exist
    ...(product.image.includes('vantaroseset') ? ['/products/vantarosesetshoot.png'] : [])
  ];

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      selectedSize: selectedSize,
      image: product.image,
      category: product.category,
      sizes: availableSizes
    });
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    handleAddToCart();
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        total={cartTotal}
      />

      {/* Breadcrumb - Desktop Only */}
      <div className="hidden md:block px-4 sm:px-6 py-4 pt-24">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/shop" className="text-black/60 hover:text-black transition-colors">
              SHOP
            </Link>
            <span className="text-black/40">/</span>
            <span className="text-black font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <div className="pt-20 md:pt-0 px-4 sm:px-6 py-4 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
            {/* Product Images - Scrollable Gallery */}
            <div className="space-y-3">
              {/* Main Image Display */}
              <div className="relative aspect-[3/4] bg-transparent overflow-hidden">
                <Image
                  src={productImages[selectedImageIndex] || ''}
                  alt={`${product.name} - View ${selectedImageIndex + 1}`}
                  fill
                  className={`object-contain transition-all duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsImageLoading(false)}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
                />
              </div>
              
              {/* Scrollable Thumbnails */}
              {productImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setIsImageLoading(true);
                      }}
                      className={`relative flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 bg-transparent border transition-all ${
                        selectedImageIndex === index
                          ? 'border-black border-2'
                          : 'border-gray-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="100px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4 md:space-y-6">
              {/* Product Name */}
              <div>
                <h1 className="font-headline text-xl sm:text-2xl md:text-3xl tracking-tight mb-1">
                  {product.name}
                </h1>
                <p className="font-body text-xs tracking-wide text-black/60 uppercase">
                  {product.category}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4">
                <span className="font-headline text-2xl sm:text-3xl tracking-tight text-black">
                  {formatPrice(product.price)}
                </span>
              </div>

              {/* Description */}
              <div>
                <p className="font-body text-sm text-black/80 leading-relaxed">
                  {product.description || 'Premium quality product designed for comfort and style.'}
                </p>
              </div>

              {/* Size Selection */}
              <div className="space-y-2">
                <h3 className="font-body text-xs tracking-wide uppercase text-black/60">SELECT SIZE</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-sm font-body font-medium border transition-all ${
                        selectedSize === size
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black/20 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="space-y-2">
                <h3 className="font-body text-xs tracking-wide uppercase text-black/60">QUANTITY</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-black/20 bg-white text-black hover:bg-black hover:text-white transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-body text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    className="w-10 h-10 border border-black/20 bg-white text-black hover:bg-black hover:text-white transition-colors"
                    disabled={quantity >= maxQuantity}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 px-6 py-3 text-sm font-body font-medium border transition-all ${
                    addedToCart
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-black border-black hover:bg-black hover:text-white'
                  }`}
                >
                  {addedToCart ? '✓ ADDED' : 'ADD TO CART'}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 px-6 py-3 text-sm font-body font-medium bg-black text-white hover:bg-gray-800 transition-all"
                >
                  BUY NOW
                </button>
              </div>

              {/* Product Details - Hidden on mobile */}
              <div className="hidden md:block space-y-4 pt-6 border-t border-black/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-body text-xs tracking-wide uppercase text-black/60">MATERIAL</h4>
                    <p className="font-body text-black/80">{product.fabric || 'Premium cotton'}</p>
                  </div>
                  <div>
                    <h4 className="font-body text-xs tracking-wide uppercase text-black/60">FIT</h4>
                    <p className="font-body text-black/80">{product.fit || 'Regular fit'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
