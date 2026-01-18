'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PerfectCurrencyService, PriceInfo, OrderCurrencyInfo, CurrencyInfo } from '@/services/currencyService';
import { OrderItem, CurrencyStatsRecord } from '@/types/common';

type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KWD' | 'BHD' | 'OMR' | 'JOD' | 'AED' | 'KES' | 'ZAR' | 'NGN' | 'EGP' | 'GHS' | 'MAD' | 'TZS' | 'UGX';

interface PerfectCurrencyContextType {
  // Current state
  currentCurrency: Currency;
  setCurrentCurrency: (currency: Currency) => void;
  
  // Currency data
  currencies: Record<Currency, CurrencyInfo>;
  allCurrencies: CurrencyInfo[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Core functions
  formatPrice: (dollars: number, targetCurrency?: Currency | string, showCode?: boolean) => string;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>;
  getPriceInfo: (dollars: number, targetCurrency?: Currency) => Promise<PriceInfo>;
  
  // Order functions
  convertOrder: (order: any) => Promise<OrderCurrencyInfo>;
  calculateRevenue: (orders: any[], targetCurrency?: Currency) => Promise<number>;
  getCurrencyStats: (orders: any[]) => Record<string, { count: number; total: number; percentage: number }>;
  
  // Utility functions
  refreshRates: () => Promise<void>;
  getCurrencySymbol: (currency: Currency) => string;
  getCurrencyName: (currency: Currency) => string;
  isBaseCurrency: (currency: Currency) => boolean;
}

const PerfectCurrencyContext = createContext<PerfectCurrencyContextType | undefined>(undefined);

export function PerfectCurrencyProvider({ children }: { children: ReactNode }) {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [currencies, setCurrencies] = useState<Record<Currency, CurrencyInfo>>({} as Record<Currency, CurrencyInfo>);
  const [allCurrencies, setAllCurrencies] = useState<CurrencyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [currencyService] = useState(() => PerfectCurrencyService.getInstance());

  // Initialize currencies
  useEffect(() => {
    initializeCurrencies();
  }, []);

  const initializeCurrencies = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Initializing perfect currency system...');

      // Get all currencies from service
      const allCurrencyInfo = currencyService.getAllCurrencies();
      const currenciesRecord: Record<Currency, CurrencyInfo> = {} as Record<Currency, CurrencyInfo>;

      allCurrencyInfo.forEach(currency => {
        currenciesRecord[currency.code as Currency] = currency;
      });

      setCurrencies(currenciesRecord);
      setAllCurrencies(allCurrencyInfo);
      setLastUpdated(currencyService.getLastUpdated());

      console.log('✅ Perfect currency system initialized with', allCurrencyInfo.length, 'currencies');
    } catch (err) {
      console.error('❌ Error initializing currency system:', err);
      setError('Failed to initialize currency system');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await currencyService.refreshRates();
      await initializeCurrencies();
      
      console.log('✅ Exchange rates refreshed successfully');
    } catch (err) {
      console.error('❌ Error refreshing rates:', err);
      setError('Failed to refresh exchange rates');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (dollars: number, targetCurrency: Currency | string = currentCurrency, showCode: boolean = false): string => {
    const result = currencyService.formatPrice(dollars, targetCurrency, showCode);
    console.log('💰 formatPrice called:', { dollars, targetCurrency, result });
    return result;
  };

  const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    return currencyService.convertAmount(amount, fromCurrency, toCurrency);
  };

  const getPriceInfo = async (dollars: number, targetCurrency: Currency = currentCurrency): Promise<PriceInfo> => {
    return currencyService.getPriceInfo(dollars, targetCurrency);
  };

  const convertOrder = async (order: any): Promise<OrderCurrencyInfo> => {
    return currencyService.convertOrder(order);
  };

  const calculateRevenue = async (orders: any[], targetCurrency: Currency = currentCurrency): Promise<number> => {
    return currencyService.calculateRevenue(orders, targetCurrency);
  };

  const getCurrencyStats = (orders: any[]) => {
    return currencyService.getCurrencyStats(orders);
  };

  const getCurrencySymbol = (currency: Currency): string => {
    return currencies[currency]?.symbol || '$';
  };

  const getCurrencyName = (currency: Currency): string => {
    return currencies[currency]?.name || currency;
  };

  const isBaseCurrency = (currency: Currency): boolean => {
    return currency === 'USD';
  };

  // Auto-refresh rates every hour
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRates();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const value: PerfectCurrencyContextType = {
    // Current state
    currentCurrency,
    setCurrentCurrency,
    
    // Currency data
    currencies,
    allCurrencies,
    
    // Loading and error states
    isLoading,
    error,
    lastUpdated,
    
    // Core functions
    formatPrice,
    convertAmount,
    getPriceInfo,
    
    // Order functions
    convertOrder,
    calculateRevenue,
    getCurrencyStats,
    
    // Utility functions
    refreshRates,
    getCurrencySymbol,
    getCurrencyName,
    isBaseCurrency,
  };

  return (
    <PerfectCurrencyContext.Provider value={value}>
      {children}
    </PerfectCurrencyContext.Provider>
  );
}

export function usePerfectCurrency() {
  const context = useContext(PerfectCurrencyContext);
  if (context === undefined) {
    throw new Error('usePerfectCurrency must be used within a PerfectCurrencyProvider');
  }
  return context;
}

// Export types for use in other components
export type { Currency, CurrencyInfo, PriceInfo, OrderCurrencyInfo };
