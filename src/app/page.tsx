'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SubscriptionForm from '@/components/SubscriptionForm';
import NewsletterSubscribe from '@/components/NewsletterSubscribe';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <Navbar />

      {/* Hero Section - More dramatic */}
      <section className="min-h-screen flex items-center justify-center relative animate-fade-in border-b-4 border-[#0A0A0A] pt-16 sm:pt-20">
        <div className="text-center px-4 sm:px-6 max-w-4xl">
          <div className="space-y-4 sm:space-y-4 md:space-y-5 lg:space-y-6">
            <h1 className="font-headline text-7xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight">
              FAITH IN
            </h1>
            <h1 className="font-headline text-7xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-stroke">
              MOTION
            </h1>
          </div>
          <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14">
            <Link href="/shop">
              <button className="group relative bg-black text-white px-10 py-4 md:px-14 md:py-5 text-sm md:text-base font-body font-bold tracking-widest border-4 border-black hover:bg-white hover:text-black transition-all duration-300 overflow-hidden">
                <span className="relative z-10">SHOP THE DROP</span>
                <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Email Capture - Functional Subscription Form */}
      <section className="py-12 sm:py-16 md:py-24 px-4 bg-[#F5F5F0]">
        <div className="max-w-md mx-auto">
          <NewsletterSubscribe />
        </div>
      </section>

      <Footer />
    </div>
  );
}
