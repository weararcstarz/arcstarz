/**
 * Background User Synchronization Service
 * Handles automatic updates to users.json file
 */

interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string; // Updated to use passwordHash instead of password
  registrationType: 'email' | 'google' | 'apple' | 'github' | 'system';
  registrationSource: 'registration_form' | 'google_oauth' | 'apple_oauth' | 'github_oauth' | 'owner_account';
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  isOwner: boolean;
  updatedAt?: string;
  loginAttempts?: number;
  lastFailedLogin?: string;
  sessionId?: string;
}

class UserSyncService {
  private static instance: UserSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastSyncTime: Date | null = null;
  private pendingUpdates: Map<string, Partial<User>> = new Map();
  private retryCount = 0;
  private maxRetries = 3;
  private isBrowser = typeof window !== 'undefined';

  private constructor() {
    if (this.isBrowser) {
      this.startService();
    }
  }

  public static getInstance(): UserSyncService {
    if (!UserSyncService.instance) {
      UserSyncService.instance = new UserSyncService();
    }
    return UserSyncService.instance;
  }

  /**
   * Start the synchronization service
   */
  private startService(): void {
    if (!this.isBrowser) return;
    
    console.log('🔄 User Sync Service: Starting...');
    
    // Initial sync
    this.performSync();
    // Set up regular sync interval (every 30 seconds)
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, 30000);

    // Set up event listeners for real-time updates
    this.setupEventListeners();

    console.log('✅ User Sync Service: Started successfully');
  }

  /**
   * Stop the synchronization service
   */
  public stopService(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ User Sync Service: Stopped');
  }

  /**
   * Setup event listeners for user activity
   */
  private setupEventListeners(): void {
    if (!this.isBrowser) return;
    
    // Listen for user login events
    window.addEventListener('userLogin', (event: any) => {
      this.queueUpdate(event.detail.userId, {
        lastLoginAt: new Date().toISOString()
      });
    });

    // Listen for user registration events
    window.addEventListener('userRegistration', (event: any) => {
      this.queueUpdate('new_user', event.detail.user);
    });

    // Listen for user update events
    window.addEventListener('userUpdate', (event: any) => {
      this.queueUpdate(event.detail.userId, event.detail.updates);
    });

    // Listen for page visibility changes to sync when user returns
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.pendingUpdates.size > 0) {
        this.performSync();
      }
    });
  }

  /**
   * Queue an update for synchronization
   */
  public queueUpdate(userId: string, updates: Partial<User>): void {
    this.pendingUpdates.set(userId, updates);
    
    // Trigger immediate sync for important updates
    if (userId === 'new_user' || updates.lastLoginAt) {
      this.performSync();
    }
    
    console.log(`📝 User Sync Service: Queued update for user ${userId}`, updates);
  }

  /**
   * Perform synchronization with the backend
   */
  private async performSync(): Promise<void> {
    if (this.isRunning || this.pendingUpdates.size === 0) {
      return;
    }

    this.isRunning = true;
    console.log(`🔄 User Sync Service: Syncing ${this.pendingUpdates.size} updates...`);

    try {
      // Get current users from file
      const currentUsers = await this.getCurrentUsers();
      
      // Apply pending updates
      const updatedUsers = this.applyUpdates(currentUsers);
      
      // Save updated users back to file
      await this.saveUsers(updatedUsers);
      
      // Clear pending updates
      this.pendingUpdates.clear();
      this.lastSyncTime = new Date();
      this.retryCount = 0;
      
      console.log('✅ User Sync Service: Sync completed successfully');
      
      // Trigger event for UI updates
      if (this.isBrowser) {
        window.dispatchEvent(new CustomEvent('usersSynced', {
          detail: {
            timestamp: this.lastSyncTime.toISOString(),
            usersCount: updatedUsers.length,
            updatesProcessed: updatedUsers.length - currentUsers.length
          }
        }));
      }
      
    } catch (error) {
      console.error('❌ User Sync Service: Sync failed:', error);
      this.retryCount++;
      
      if (this.retryCount < this.maxRetries) {
        console.log(`🔄 User Sync Service: Retrying in 5 seconds... (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.performSync(), 5000);
      } else {
        console.error('❌ User Sync Service: Max retries reached, giving up');
        this.pendingUpdates.clear();
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get current users from the file
   */
  private async getCurrentUsers(): Promise<User[]> {
    try {
      const response = await fetch('/api/admin/users/sync', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('❌ User Sync Service: Failed to get current users:', error);
      return [];
    }
  }

  /**
   * Apply pending updates to users array
   */
  private applyUpdates(currentUsers: User[]): User[] {
    let updatedUsers = [...currentUsers];
    
    this.pendingUpdates.forEach((updates, userId) => {
      if (userId === 'new_user') {
        // Add new user
        const newUser: User = {
          id: this.generateUserId(),
          email: updates.email || '',
          name: updates.name || '',
          passwordHash: updates.passwordHash, // Updated to use passwordHash
          registrationType: updates.registrationType || 'email',
          registrationSource: updates.registrationSource || 'registration_form',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          isActive: true,
          isOwner: false
        };
        updatedUsers.push(newUser);
        console.log('➕ User Sync Service: Added new user:', newUser.email);
      } else {
        // Update existing user
        const userIndex = updatedUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          const existingUser = updatedUsers[userIndex];
          if (existingUser) {
            updatedUsers[userIndex] = {
              ...existingUser,
              ...updates,
              updatedAt: new Date().toISOString()
            };
          }
          console.log('✏️ User Sync Service: Updated user:', userId, updates);
        } else {
          console.warn('⚠️ User Sync Service: User not found for update:', userId);
        }
      }
    });
    
    // Sort users by last login (newest first)
    updatedUsers.sort((a, b) => 
      new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
    );
    
    return updatedUsers;
  }

  /**
   * Save updated users to the file
   */
  private async saveUsers(users: User[]): Promise<void> {
    try {
      const response = await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users: users,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('💾 User Sync Service: Saved users to file:', data);
    } catch (error) {
      console.error('❌ User Sync Service: Failed to save users:', error);
      throw error;
    }
  }

  /**
   * Generate a unique user ID
   */
  private generateUserId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }

  /**
   * Get service status
   */
  public getStatus(): {
    isRunning: boolean;
    lastSyncTime: Date | null;
    pendingUpdates: number;
    retryCount: number;
  } {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      pendingUpdates: this.pendingUpdates.size,
      retryCount: this.retryCount
    };
  }

  /**
   * Force immediate sync
   */
  public forceSync(): Promise<void> {
    console.log('🔄 User Sync Service: Force sync requested');
    return this.performSync();
  }

  /**
   * Clear all pending updates
   */
  public clearPendingUpdates(): void {
    this.pendingUpdates.clear();
    console.log('🗑️ User Sync Service: Cleared all pending updates');
  }
}

// Export singleton instance
export const userSyncService = UserSyncService.getInstance();

// Export utility functions
export const queueUserUpdate = (userId: string, updates: Partial<User>) => {
  userSyncService.queueUpdate(userId, updates);
};

export const forceUserSync = () => {
  return userSyncService.forceSync();
};

export const getUserSyncStatus = () => {
  return userSyncService.getStatus();
};

export const clearUserUpdates = () => {
  userSyncService.clearPendingUpdates();
};

// Auto-initialize the service
if (typeof window !== 'undefined') {
  // Service will auto-start when imported
  console.log('🚀 User Sync Service: Auto-initialized');
}
