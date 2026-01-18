'use client';

import { useState, useEffect } from 'react';
import { usePerfectCurrency } from '@/contexts/PerfectCurrencyContext';
import { products } from '@/data/products';

export default function CurrencyRatesPage() {
  const { currencies, lastUpdated, isLoading, error, formatPrice } = usePerfectCurrency();
  const [selectedProduct, setSelectedProduct] = useState(products[0] || null);
  const [conversions, setConversions] = useState<Record<string, { symbol: string; price: string }>>({});
  const [showJSON, setShowJSON] = useState(false);

  useEffect(() => {
    if (Object.keys(currencies).length > 0 && selectedProduct) {
      const newConversions: Record<string, { symbol: string; price: string }> = {};
      Object.keys(currencies).forEach(currencyCode => {
        const currency = currencies[currencyCode as keyof typeof currencies];
        newConversions[currencyCode] = {
          symbol: currency.symbol,
          price: formatPrice(selectedProduct.price, currencyCode) + ` ${currencyCode}`
        };
      });
      setConversions(newConversions);
    }
  }, [currencies, selectedProduct, formatPrice]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="font-headline text-4xl tracking-tight mb-4">
              Loading Exchange Rates...
            </h1>
            <div className="animate-pulse">
              <div className="h-4 bg-[#0A0A0A] opacity-20 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-[#0A0A0A] opacity-20 rounded w-48 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="font-headline text-4xl tracking-tight mb-4 text-red-600">
              Error Loading Rates
            </h1>
            <p className="font-body text-sm text-[#1C1C1C] mb-8">
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currencyOrder = [
    'USD', 'EUR', 'GBP', 'JPY',
    'KWD', 'BHD', 'OMR', 'JOD', 'AED',
    'KES', 'ZAR', 'NGN', 'EGP', 'GHS', 'MAD', 'TZS', 'UGX'
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] pt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-headline text-5xl md:text-6xl tracking-tight mb-4">
            CURRENCY RATES
          </h1>
          {selectedProduct && (
            <>
              <p className="font-subtitle tracking-wider text-[#1C1C1C] mb-4">
                Real-Time Exchange Rates for {selectedProduct.name}
              </p>
              <p className="font-body text-sm text-[#BFBFBF] mb-2">
                Base Price: ${selectedProduct.price} USD
              </p>
            </>
          )}
          {lastUpdated && (
            <p className="font-body text-xs text-[#BFBFBF]">
              Last Updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* Product Selector */}
        <div className="flex justify-center mb-8">
          <div className="border-4 border-[#0A0A0A] bg-[#F5F5F0] p-4 max-w-md w-full">
            <label className="block font-headline text-sm tracking-tight mb-3">
              SELECT PRODUCT
            </label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value);
                if (product) setSelectedProduct(product);
              }}
              className="w-full px-4 py-3 bg-[#F5F5F0] border-2 border-[#0A0A0A] font-body text-sm focus:outline-none focus:border-[#1C1C1C]"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price} USD
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setShowJSON(false)}
            className={`px-6 py-3 font-body text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
              !showJSON
                ? 'bg-[#0A0A0A] text-[#F5F5F0]'
                : 'bg-transparent text-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F5F5F0]'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setShowJSON(true)}
            className={`px-6 py-3 font-body text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
              showJSON
                ? 'bg-[#0A0A0A] text-[#F5F5F0]'
                : 'bg-transparent text-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F5F5F0]'
            }`}
          >
            JSON View
          </button>
        </div>

        {!showJSON ? (
          /* Table View */
          <div className="border-4 border-[#0A0A0A] bg-[#F5F5F0] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#0A0A0A] text-[#F5F5F0]">
                <tr>
                  <th className="px-6 py-4 text-left font-headline text-sm tracking-tight uppercase">Currency</th>
                  <th className="px-6 py-4 text-left font-headline text-sm tracking-tight uppercase">Symbol</th>
                  <th className="px-6 py-4 text-right font-headline text-sm tracking-tight uppercase">Price</th>
                  <th className="px-6 py-4 text-left font-headline text-sm tracking-tight uppercase">Name</th>
                </tr>
              </thead>
              <tbody>
                {currencyOrder.map((code, index) => {
                  const conversion = conversions[code];
                  const currency = currencies[code as keyof typeof currencies];
                  const isMiddleEastern = ['KWD', 'BHD', 'OMR', 'JOD', 'AED'].includes(code);
                  const isAfrican = ['KES', 'ZAR', 'NGN', 'EGP', 'GHS', 'MAD', 'TZS', 'UGX'].includes(code);
                  
                  return (
                    <tr 
                      key={code}
                      className={`border-t border-[#0A0A0A] opacity-20 ${
                        code === 'USD' ? 'bg-[#0A0A0A] bg-opacity-10' : ''
                      } ${isMiddleEastern ? 'bg-[#BFBFBF] bg-opacity-5' : ''} ${
                        isAfrican ? 'bg-[#1C1C1C] bg-opacity-5' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-headline text-sm tracking-tight">
                        {code}
                        {code === 'USD' && <span className="ml-2 text-xs text-[#BFBFBF]">(Base)</span>}
                      </td>
                      <td className="px-6 py-4 font-body text-sm">{conversion?.symbol}</td>
                      <td className="px-6 py-4 text-right font-headline text-sm tracking-tight">
                        {conversion?.price}
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-[#1C1C1C]">
                        {currency?.name}
                        {isMiddleEastern && <span className="ml-2 text-xs text-[#BFBFBF]">(Middle East)</span>}
                        {isAfrican && <span className="ml-2 text-xs text-[#BFBFBF]">(Africa)</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* JSON View */
          <div className="border-4 border-[#0A0A0A] bg-[#F5F5F0] p-6">
            <div className="relative">
              <pre className="font-mono text-sm text-[#0A0A0A] overflow-x-auto">
                <code>{JSON.stringify(conversions, null, 2)}</code>
              </pre>
              
              {/* Copy Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(conversions, null, 2));
                  alert('JSON copied to clipboard!');
                }}
                className="absolute top-4 right-4 px-4 py-2 bg-[#0A0A0A] text-[#F5F5F0] font-body text-xs uppercase tracking-wider hover:bg-[#1C1C1C] transition-colors"
              >
                Copy JSON
              </button>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border-4 border-[#0A0A0A] p-6">
            <h2 className="font-headline text-xl tracking-tight mb-4">
              Middle Eastern Currencies
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between font-body text-sm">
                <span>Kuwaiti Dinar (KWD)</span>
                <span className="font-bold">{conversions.KWD?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>Bahraini Dinar (BHD)</span>
                <span className="font-bold">{conversions.BHD?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>Omani Rial (OMR)</span>
                <span className="font-bold">{conversions.OMR?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>Jordanian Dinar (JOD)</span>
                <span className="font-bold">{conversions.JOD?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>UAE Dirham (AED)</span>
                <span className="font-bold">{conversions.AED?.price}</span>
              </div>
            </div>
          </div>

          <div className="border-4 border-[#0A0A0A] p-6">
            <h2 className="font-headline text-xl tracking-tight mb-4">
              African Currencies
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between font-body text-sm">
                <span>Kenyan Shilling (KES)</span>
                <span className="font-bold">{conversions.KES?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>South African Rand (ZAR)</span>
                <span className="font-bold">{conversions.ZAR?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>Nigerian Naira (NGN)</span>
                <span className="font-bold">{conversions.NGN?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>Egyptian Pound (EGP)</span>
                <span className="font-bold">{conversions.EGP?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>Ghanaian Cedi (GHS)</span>
                <span className="font-bold">{conversions.GHS?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>Moroccan Dirham (MAD)</span>
                <span className="font-bold">{conversions.MAD?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>Tanzanian Shilling (TZS)</span>
                <span className="font-bold">{conversions.TZS?.price}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span>Ugandan Shilling (UGX)</span>
                <span className="font-bold">{conversions.UGX?.price}</span>
              </div>
            </div>
          </div>

          <div className="border-4 border-[#0A0A0A] p-6">
            <h2 className="font-headline text-xl tracking-tight mb-4">
              API Information
            </h2>
            <div className="space-y-2 font-body text-sm text-[#1C1C1C]">
              <p><strong>Source:</strong> exchangerate-api.com</p>
              <p><strong>Base Currency:</strong> USD</p>
              <p><strong>Update Frequency:</strong> Every hour</p>
              <p><strong>Total Currencies:</strong> 17</p>
              <p><strong>Regions:</strong> Global, Middle East, Africa</p>
              <p><strong>Status:</strong> {isLoading ? 'Loading...' : 'Active'}</p>
            </div>
          </div>
        </div>

        {/* Back to Shop */}
        <div className="text-center mt-12">
          {selectedProduct && (
            <a 
              href={`/product/${selectedProduct.id}`}
              className="btn-primary hover-lift mr-4"
            >
              Shop {selectedProduct.name}
            </a>
          )}
          <a href="/" className="btn-secondary hover-lift">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
