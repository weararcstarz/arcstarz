'use client';

import { useState } from 'react';
import { usePerfectCurrency } from '@/contexts/PerfectCurrencyContext';

export default function CurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentCurrency, setCurrentCurrency, currencies, isLoading, error, refreshRates, lastUpdated } = usePerfectCurrency();

  const currencyOrder = [
    'USD', 'EUR', 'GBP', 'JPY',
    'KWD', 'BHD', 'OMR', 'JOD', 'AED',
    'KES', 'ZAR', 'NGN', 'EGP', 'GHS', 'MAD', 'TZS', 'UGX'
  ];

  const currentCurrencyInfo = currencies[currentCurrency as keyof typeof currencies];

  if (isLoading) {
    return (
      <div className="font-body text-sm uppercase tracking-wider opacity-50">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-body text-sm uppercase tracking-wider text-red-600">
        Error
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="font-body text-sm uppercase tracking-wider hover:text-[#BFBFBF] transition-colors font-semibold border-b-2 border-transparent hover:border-[#0A0A0A] pb-1 flex items-center gap-1"
      >
        {currentCurrency}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-56 bg-[#F5F5F0] border-2 border-[#0A0A0A] z-50 max-h-96 overflow-y-auto">
            {/* Major Currencies */}
            <div className="border-b border-[#0A0A0A] opacity-20">
              <div className="px-4 py-2 font-body text-xs uppercase tracking-wider text-[#1C1C1C] opacity-70">
                Major Currencies
              </div>
            </div>
            
            {currencyOrder.slice(0, 4).map((curr) => {
              const info = currencies[curr as keyof typeof currencies];
              return (
                <button
                  key={curr}
                  onClick={() => {
                    setCurrentCurrency(curr as any);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 font-body text-sm transition-colors ${
                    currentCurrency === curr
                      ? 'bg-[#0A0A0A] text-[#F5F5F0]'
                      : 'text-[#0A0A0A] hover:bg-[#0A0A0A] hover:bg-opacity-10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{curr}</span>
                      <span className="text-xs opacity-70">{info?.symbol}</span>
                    </div>
                    <span className="text-xs opacity-50">{info?.name}</span>
                  </div>
                </button>
              );
            })}

            {/* Middle Eastern Currencies */}
            <div className="border-b border-[#0A0A0A] opacity-20 mt-2">
              <div className="px-4 py-2 font-body text-xs uppercase tracking-wider text-[#1C1C1C] opacity-70">
                Middle Eastern Currencies
              </div>
            </div>
            
            {currencyOrder.slice(4, 9).map((curr) => {
              const info = currencies[curr as keyof typeof currencies];
              return (
                <button
                  key={curr}
                  onClick={() => {
                    setCurrentCurrency(curr as any);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 font-body text-sm transition-colors ${
                    currentCurrency === curr
                      ? 'bg-[#0A0A0A] text-[#F5F5F0]'
                      : 'text-[#0A0A0A] hover:bg-[#0A0A0A] hover:bg-opacity-10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{curr}</span>
                      <span className="text-xs opacity-70">{info?.symbol}</span>
                    </div>
                    <span className="text-xs opacity-50">{info?.name}</span>
                  </div>
                </button>
              );
            })}

            {/* African Currencies */}
            <div className="border-b border-[#0A0A0A] opacity-20 mt-2">
              <div className="px-4 py-2 font-body text-xs uppercase tracking-wider text-[#1C1C1C] opacity-70">
                African Currencies
              </div>
            </div>
            
            {currencyOrder.slice(9).map((curr) => {
              const info = currencies[curr as keyof typeof currencies];
              return (
                <button
                  key={curr}
                  onClick={() => {
                    setCurrentCurrency(curr as any);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 font-body text-sm transition-colors ${
                    currentCurrency === curr
                      ? 'bg-[#0A0A0A] text-[#F5F5F0]'
                      : 'text-[#0A0A0A] hover:bg-[#0A0A0A] hover:bg-opacity-10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{curr}</span>
                      <span className="text-xs opacity-70">{info?.symbol}</span>
                    </div>
                    <span className="text-xs opacity-50">{info?.name}</span>
                  </div>
                </button>
              );
            })}

            {/* Footer with refresh button */}
            <div className="border-t border-[#0A0A0A] opacity-20 p-3">
              <button
                onClick={() => {
                  refreshRates();
                  setIsOpen(false);
                }}
                className="w-full text-xs text-center text-[#1C1C1C] hover:text-[#0A0A0A] transition-colors font-body"
              >
                Refresh Exchange Rates
              </button>
              {lastUpdated && (
                <p className="text-xs text-gray-500 text-center mt-1 font-body">
                  Updated: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
