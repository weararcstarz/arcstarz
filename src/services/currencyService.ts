// Perfect Currency Exchange Service
// Handles all currency conversions, rates, and formatting

// Define types locally to avoid import issues
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  currency: string;
}

export interface CurrencyStatsRecord {
  [currency: string]: {
    count: number;
    total: number;
    percentage: number;
  };
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  lastUpdated: string;
}

export interface PriceInfo {
  amount: number;
  currency: string;
  formatted: string;
  inUSD: number;
}

export interface OrderCurrencyInfo {
  id: string;
  originalTotal: number;
  originalCurrency: string;
  convertedTotal: number;
  baseCurrency: string;
  exchangeRate: number;
}

export class PerfectCurrencyService {
  private static instance: PerfectCurrencyService;
  private rates: Map<string, CurrencyInfo> = new Map();
  private readonly BASE_CURRENCY = 'USD';
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  private constructor() {
    this.initializeDefaultRates();
    this.loadExchangeRates();
  }

  static getInstance(): PerfectCurrencyService {
    if (!PerfectCurrencyService.instance) {
      PerfectCurrencyService.instance = new PerfectCurrencyService();
    }
    return PerfectCurrencyService.instance;
  }

  private initializeDefaultRates(): void {
    const defaultCurrencies: CurrencyInfo[] = [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1, lastUpdated: new Date().toISOString() },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, lastUpdated: new Date().toISOString() },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, lastUpdated: new Date().toISOString() },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 149.50, lastUpdated: new Date().toISOString() },
      { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', rate: 0.31, lastUpdated: new Date().toISOString() },
      { code: 'BHD', name: 'Bahraini Dinar', symbol: 'ب.د', rate: 0.38, lastUpdated: new Date().toISOString() },
      { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', rate: 0.38, lastUpdated: new Date().toISOString() },
      { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.أ', rate: 0.71, lastUpdated: new Date().toISOString() },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 3.67, lastUpdated: new Date().toISOString() },
      { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 129.50, lastUpdated: new Date().toISOString() },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.75, lastUpdated: new Date().toISOString() },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 771.25, lastUpdated: new Date().toISOString() },
      { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', rate: 31.00, lastUpdated: new Date().toISOString() },
      { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', rate: 12.25, lastUpdated: new Date().toISOString() },
      { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', rate: 9.85, lastUpdated: new Date().toISOString() },
      { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', rate: 2480.00, lastUpdated: new Date().toISOString() },
      { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', rate: 3760.00, lastUpdated: new Date().toISOString() },
    ];

    defaultCurrencies.forEach(currency => {
      this.rates.set(currency.code, currency);
    });
  }

  private async loadExchangeRates(): Promise<void> {
    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rates = data.rates;

      // Update rates with fresh data
      Object.entries(rates).forEach(([code, rate]) => {
        const existingCurrency = this.rates.get(code);
        if (existingCurrency) {
          existingCurrency.rate = rate as number;
          existingCurrency.lastUpdated = new Date().toISOString();
        }
      });

      console.log('✅ Exchange rates updated successfully');
    } catch (error) {
      console.warn('⚠️ Failed to fetch exchange rates, using defaults:', error);
    }
  }

  private async refreshIfNeeded(): Promise<void> {
    const usdRate = this.rates.get('USD');
    if (!usdRate) return;

    const lastUpdated = new Date(usdRate.lastUpdated);
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdated.getTime();

    if (timeDiff > this.CACHE_DURATION) {
      await this.loadExchangeRates();
    }
  }

  // Convert price from dollars to formatted string in target currency
  public formatPrice(dollars: number, targetCurrency: string = 'USD', showCode: boolean = false): string {
    this.refreshIfNeeded();
    
    const targetRate = this.rates.get(targetCurrency);
    if (!targetRate) {
      return `$${dollars.toFixed(2)}`;
    }

    // Convert USD to target currency
    const targetAmount = dollars * targetRate.rate;
    const symbol = targetRate.symbol;

    // Special formatting for different currencies
    if (targetCurrency === 'JPY') {
      const formatted = `${symbol}${Math.round(targetAmount).toLocaleString()}`;
      return showCode ? `${formatted} ${targetCurrency}` : formatted;
    }

    if (['KWD', 'BHD', 'OMR', 'JOD', 'AED'].includes(targetCurrency)) {
      const formatted = `${symbol}${targetAmount.toFixed(3)}`;
      return showCode ? `${formatted} ${targetCurrency}` : formatted;
    }

    if (['KES', 'ZAR', 'NGN', 'TZS', 'UGX'].includes(targetCurrency)) {
      const formatted = `${symbol}${Math.round(targetAmount).toLocaleString()}`;
      return showCode ? `${formatted} ${targetCurrency}` : formatted;
    }

    const formatted = `${symbol}${targetAmount.toFixed(2)}`;
    return showCode ? `${formatted} ${targetCurrency}` : formatted;
  }

  // Convert amount from one currency to another
  public async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    await this.refreshIfNeeded();

    const fromRate = this.rates.get(fromCurrency);
    const toRate = this.rates.get(toCurrency);

    if (!fromRate || !toRate) {
      return amount;
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate.rate;
    const convertedAmount = usdAmount * toRate.rate;

    return convertedAmount;
  }

  // Get price info for a product
  public async getPriceInfo(dollars: number, targetCurrency: string = 'USD'): Promise<PriceInfo> {
    await this.refreshIfNeeded();

    const targetRate = this.rates.get(targetCurrency);
    const targetAmount = targetRate ? dollars * targetRate.rate : dollars;

    return {
      amount: targetAmount,
      currency: targetCurrency,
      formatted: this.formatPrice(dollars, targetCurrency),
      inUSD: dollars
    };
  }

  // Convert order total to base currency
  public async convertOrder(order: any): Promise<OrderCurrencyInfo> {
    await this.refreshIfNeeded();

    const { total, currency } = order;
    const baseCurrency = this.BASE_CURRENCY;

    if (currency === baseCurrency) {
      return {
        id: order.id,
        originalTotal: total,
        originalCurrency: currency,
        convertedTotal: total,
        baseCurrency,
        exchangeRate: 1
      };
    }

    const convertedTotal = await this.convertAmount(total, currency, baseCurrency);
    const exchangeRate = this.rates.get(currency)?.rate || 1;

    return {
      id: order.id,
      originalTotal: total,
      originalCurrency: currency,
      convertedTotal: convertedTotal,
      baseCurrency,
      exchangeRate
    };
  }

  // Calculate total revenue in target currency
  public async calculateRevenue(orders: { total: number; currency: string }[], targetCurrency: string = 'USD'): Promise<number> {
    await this.refreshIfNeeded();

    let totalRevenue = 0;

    for (const order of orders) {
      if (order.currency === targetCurrency) {
        totalRevenue += order.total;
      } else {
        const convertedAmount = await this.convertAmount(order.total, order.currency, targetCurrency);
        totalRevenue += convertedAmount;
      }
    }

    return totalRevenue;
  }

  // Get currency statistics
  public getCurrencyStats(orders: { total: number; currency: string }[]): CurrencyStatsRecord {
    const stats: CurrencyStatsRecord = {};
    const totalOrders = orders.length;

    orders.forEach(order => {
      if (!stats[order.currency]) {
        stats[order.currency] = { count: 0, total: 0, percentage: 0 };
      }
      const currencyStat = stats[order.currency];
      if (currencyStat) {
        currencyStat.count++;
        currencyStat.total += order.total;
      }
    });

    // Calculate percentages
    Object.values(stats).forEach((stat: any) => {
      stat.percentage = totalOrders > 0 ? (stat.count / totalOrders) * 100 : 0;
    });

    return stats;
  }

  // Get all available currencies
  public getAllCurrencies(): CurrencyInfo[] {
    return Array.from(this.rates.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  // Get specific currency info
  public getCurrencyInfo(currencyCode: string): CurrencyInfo | undefined {
    return this.rates.get(currencyCode);
  }

  // Refresh all rates
  public async refreshRates(): Promise<void> {
    await this.loadExchangeRates();
  }

  // Get last updated time
  public getLastUpdated(): string | null {
    const usdRate = this.rates.get('USD');
    return usdRate ? usdRate.lastUpdated : null;
  }

  // Check if rates are loading
  public isLoading(): boolean {
    // This would need to be implemented with proper state management
    return false;
  }

  // Get any errors
  public getError(): string | null {
    // This would need to be implemented with proper state management
    return null;
  }
}
