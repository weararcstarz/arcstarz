/**
 * ARCSTARZ Connected System
 * Integrates user management, product tracking, and shop experience
 */

interface ConnectedUser {
  id: string;
  email: string;
  name: string;
  preferences: {
    viewedProducts: string[];
    wishlist: string[];
    cartHistory: string[];
    searchHistory: string[];
    lastViewedProduct?: string;
    favoriteCategories: string[];
  };
  activity: {
    loginCount: number;
    totalSessions: number;
    avgSessionDuration: number;
    lastActivity: string;
    productsViewed: number;
    addToCartCount: number;
  };
}

interface ConnectedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  analytics: {
    viewCount: number;
    addToCartCount: number;
    wishlistCount: number;
    conversionRate: number;
    avgViewDuration: number;
    popularCategories: string[];
  };
  connections: {
    frequentlyViewedTogether: string[];
    similarProducts: string[];
    categoryTrends: string[];
  };
}

interface ConnectedEvent {
  type: 'user_login' | 'user_logout' | 'product_view' | 'add_to_cart' | 'search' | 'category_filter' | 'wishlist_add';
  userId?: string;
  productId?: string;
  data: any;
  timestamp: string;
  sessionId: string;
}

class ConnectedSystem {
  private static instance: ConnectedSystem;
  private isBrowser = typeof window !== 'undefined';
  private sessionId: string = '';
  private eventQueue: ConnectedEvent[] = [];
  private users: Map<string, ConnectedUser> = new Map();
  private products: Map<string, ConnectedProduct> = new Map();
  private isConnected = false;

  private constructor() {
    if (this.isBrowser) {
      this.sessionId = this.generateSessionId();
      this.initializeConnection();
      this.setupEventListeners();
      this.startSyncService();
    }
  }

  public static getInstance(): ConnectedSystem {
    if (!ConnectedSystem.instance) {
      ConnectedSystem.instance = new ConnectedSystem();
    }
    return ConnectedSystem.instance;
  }

  /**
   * Initialize the connected system
   */
  private initializeConnection(): void {
    console.log('🔗 ARCSTARZ Connected System: Initializing...');
    
    // Load existing data
    this.loadUserData();
    this.loadProductData();
    
    // Establish connection
    this.establishConnection();
    
    console.log('✅ ARCSTARZ Connected System: Ready');
  }

  /**
   * Establish real-time connection
   */
  private establishConnection(): void {
    // Simulate connection establishment
    setTimeout(() => {
      this.isConnected = true;
      console.log('🌐 ARCSTARZ Connected System: Real-time connection established');
      
      // Trigger connection event
      this.dispatchEvent('system_connected', {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      });
    }, 1000);
  }

  /**
   * Setup event listeners for user interactions
   */
  private setupEventListeners(): void {
    if (!this.isBrowser) return;

    // Product view tracking
    window.addEventListener('productView', (event: any) => {
      this.trackProductView(event.detail.productId, event.detail.userId);
    });

    // Add to cart tracking
    window.addEventListener('addToCart', (event: any) => {
      this.trackAddToCart(event.detail.productId, event.detail.userId);
    });

    // Search tracking
    window.addEventListener('search', (event: any) => {
      this.trackSearch(event.detail.query, event.detail.userId);
    });

    // Category filter tracking
    window.addEventListener('categoryFilter', (event: any) => {
      this.trackCategoryFilter(event.detail.category, event.detail.userId);
    });

    // User activity tracking
    window.addEventListener('userActivity', (event: any) => {
      this.trackUserActivity(event.detail.userId, event.detail.activity);
    });

    // Page visibility tracking
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackSessionEnd();
      } else {
        this.trackSessionStart();
      }
    });
  }

  /**
   * Track product views
   */
  public trackProductView(productId: string, userId?: string): void {
    const event: ConnectedEvent = {
      type: 'product_view',
      userId,
      productId,
      data: { timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.queueEvent(event);
    this.updateProductAnalytics(productId, 'view');
    this.updateUserPreferences(userId, 'viewedProducts', productId);
    
    console.log('👁️ Product view tracked:', productId, 'by user:', userId);
  }

  /**
   * Track add to cart events
   */
  public trackAddToCart(productId: string, userId?: string): void {
    const event: ConnectedEvent = {
      type: 'add_to_cart',
      userId,
      productId,
      data: { timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.queueEvent(event);
    this.updateProductAnalytics(productId, 'addToCart');
    this.updateUserActivity(userId, 'addToCartCount');
    
    console.log('🛒 Add to cart tracked:', productId, 'by user:', userId);
  }

  /**
   * Track search queries
   */
  public trackSearch(query: string, userId?: string): void {
    const event: ConnectedEvent = {
      type: 'search',
      userId,
      data: { query, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.queueEvent(event);
    this.updateUserPreferences(userId, 'searchHistory', query);
    
    console.log('🔍 Search tracked:', query, 'by user:', userId);
  }

  /**
   * Track category filters
   */
  public trackCategoryFilter(category: string, userId?: string): void {
    const event: ConnectedEvent = {
      type: 'category_filter',
      userId,
      data: { category, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.queueEvent(event);
    this.updateUserPreferences(userId, 'favoriteCategories', category);
    
    console.log('🏷️ Category filter tracked:', category, 'by user:', userId);
  }

  /**
   * Track user activity
   */
  public trackUserActivity(userId?: string, activity?: string): void {
    if (!userId) return;

    const user = this.users.get(userId);
    if (user) {
      user.activity.lastActivity = new Date().toISOString();
      user.activity.totalSessions++;
      
      this.users.set(userId, user);
    }
    
    console.log('👤 User activity tracked:', userId, activity);
  }

  /**
   * Update product analytics
   */
  private updateProductAnalytics(productId: string, action: 'view' | 'addToCart' | 'wishlist'): void {
    let product = this.products.get(productId);
    
    if (!product) {
      // Initialize product if not exists
      product = {
        id: productId,
        name: '',
        category: '',
        price: 0,
        analytics: {
          viewCount: 0,
          addToCartCount: 0,
          wishlistCount: 0,
          conversionRate: 0,
          avgViewDuration: 0,
          popularCategories: []
        },
        connections: {
          frequentlyViewedTogether: [],
          similarProducts: [],
          categoryTrends: []
        }
      };
    }

    // Update analytics based on action
    switch (action) {
      case 'view':
        product.analytics.viewCount++;
        break;
      case 'addToCart':
        product.analytics.addToCartCount++;
        break;
      case 'wishlist':
        product.analytics.wishlistCount++;
        break;
    }

    // Calculate conversion rate
    if (product.analytics.viewCount > 0) {
      product.analytics.conversionRate = 
        (product.analytics.addToCartCount / product.analytics.viewCount) * 100;
    }

    this.products.set(productId, product);
  }

  /**
   * Update user preferences
   */
  private updateUserPreferences(userId: string | undefined, preference: string, value: string): void {
    if (!userId) return;

    let user = this.users.get(userId);
    
    if (!user) {
      // Initialize user if not exists
      user = {
        id: userId,
        email: '',
        name: '',
        preferences: {
          viewedProducts: [],
          wishlist: [],
          cartHistory: [],
          searchHistory: [],
          favoriteCategories: [],
          lastViewedProduct: undefined
        },
        activity: {
          loginCount: 0,
          totalSessions: 0,
          avgSessionDuration: 0,
          lastActivity: new Date().toISOString(),
          productsViewed: 0,
          addToCartCount: 0
        }
      };
    }

    // Update preferences based on type
    switch (preference) {
      case 'viewedProducts':
        if (!user.preferences.viewedProducts.includes(value)) {
          user.preferences.viewedProducts.push(value);
          user.preferences.lastViewedProduct = value;
          user.activity.productsViewed++;
        }
        break;
      case 'searchHistory':
        if (!user.preferences.searchHistory.includes(value)) {
          user.preferences.searchHistory.push(value);
        }
        break;
      case 'favoriteCategories':
        if (!user.preferences.favoriteCategories.includes(value)) {
          user.preferences.favoriteCategories.push(value);
        }
        break;
    }

    user.activity.lastActivity = new Date().toISOString();
    this.users.set(userId, user);
  }

  /**
   * Update user activity
   */
  private updateUserActivity(userId: string | undefined, activity: string): void {
    if (!userId) return;

    const user = this.users.get(userId);
    if (user) {
      switch (activity) {
        case 'addToCartCount':
          user.activity.addToCartCount++;
          break;
      }
      
      user.activity.lastActivity = new Date().toISOString();
      this.users.set(userId, user);
    }
  }

  /**
   * Queue events for processing
   */
  private queueEvent(event: ConnectedEvent): void {
    this.eventQueue.push(event);
    
    // Process events immediately for real-time feel
    this.processEvents();
  }

  /**
   * Process queued events
   */
  private processEvents(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }

  /**
   * Send event to connected systems
   */
  private sendEvent(event: ConnectedEvent): void {
    // In a real implementation, this would send to backend
    console.log('📡 Event sent:', event.type, event);
    
    // Trigger real-time updates
    this.dispatchEvent('dataUpdated', {
      event,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track session start
   */
  private trackSessionStart(): void {
    console.log('🚀 Session started:', this.sessionId);
    
    this.dispatchEvent('sessionStarted', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track session end
   */
  private trackSessionEnd(): void {
    console.log('🏁 Session ended:', this.sessionId);
    
    this.dispatchEvent('sessionEnded', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Start sync service
   */
  private startSyncService(): void {
    // Sync every 30 seconds
    setInterval(() => {
      this.syncData();
    }, 30000);
  }

  /**
   * Sync data with backend
   */
  private async syncData(): Promise<void> {
    try {
      // In a real implementation, this would sync with backend
      console.log('🔄 Syncing connected data...');
      
      // Trigger sync event
      this.dispatchEvent('dataSynced', {
        timestamp: new Date().toISOString(),
        usersCount: this.users.size,
        productsCount: this.products.size
      });
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
    }
  }

  /**
   * Load user data
   */
  private loadUserData(): void {
    // In a real implementation, this would load from backend
    console.log('📥 Loading user data...');
  }

  /**
   * Load product data
   */
  private loadProductData(): void {
    // In a real implementation, this would load from backend
    console.log('📦 Loading product data...');
  }

  /**
   * Dispatch custom event
   */
  private dispatchEvent(type: string, data: any): void {
    if (this.isBrowser) {
      window.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    isConnected: boolean;
    sessionId: string;
    usersCount: number;
    productsCount: number;
    eventQueueSize: number;
  } {
    return {
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      usersCount: this.users.size,
      productsCount: this.products.size,
      eventQueueSize: this.eventQueue.length
    };
  }

  /**
   * Get user insights
   */
  public getUserInsights(userId: string): ConnectedUser | undefined {
    return this.users.get(userId);
  }

  /**
   * Get product insights
   */
  public getProductInsights(productId: string): ConnectedProduct | undefined {
    return this.products.get(productId);
  }

  /**
   * Get system analytics
   */
  public getSystemAnalytics(): {
    totalUsers: number;
    totalProducts: number;
    totalEvents: number;
    avgSessionDuration: number;
    topProducts: string[];
    topCategories: string[];
  } {
    const totalUsers = this.users.size;
    const totalProducts = this.products.size;
    const totalEvents = this.eventQueue.length;
    
    // Calculate analytics
    const avgSessionDuration = Array.from(this.users.values())
      .reduce((sum, user) => sum + user.activity.avgSessionDuration, 0) / totalUsers || 0;

    return {
      totalUsers,
      totalProducts,
      totalEvents,
      avgSessionDuration,
      topProducts: [],
      topCategories: []
    };
  }
}

// Export singleton instance
export const connectedSystem = ConnectedSystem.getInstance();

// Export utility functions
export const trackProductView = (productId: string, userId?: string) => {
  connectedSystem.trackProductView(productId, userId);
};

export const trackAddToCart = (productId: string, userId?: string) => {
  connectedSystem.trackAddToCart(productId, userId);
};

export const trackSearch = (query: string, userId?: string) => {
  connectedSystem.trackSearch(query, userId);
};

export const trackCategoryFilter = (category: string, userId?: string) => {
  connectedSystem.trackCategoryFilter(category, userId);
};

export const getConnectionStatus = () => connectedSystem.getConnectionStatus();
export const getUserInsights = (userId: string) => connectedSystem.getUserInsights(userId);
export const getProductInsights = (productId: string) => connectedSystem.getProductInsights(productId);
export const getSystemAnalytics = () => connectedSystem.getSystemAnalytics();
