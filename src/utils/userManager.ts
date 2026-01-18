/**
 * Automatic User Management System
 * Keeps users.json synchronized with user activity
 */

interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  registrationType: 'email' | 'google' | 'apple' | 'github' | 'system';
  registrationSource: 'registration_form' | 'google_oauth' | 'apple_oauth' | 'github_oauth' | 'owner_account';
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  isOwner: boolean;
}

class UserManager {
  private usersFilePath = '/users.json';
  private users: User[] = [];
  private updateQueue: Map<string, Partial<User>> = new Map();
  private isProcessing = false;
  private isBrowser = typeof window !== 'undefined';

  constructor() {
    this.loadUsers();
    if (this.isBrowser) {
      this.startAutoSync();
    }
  }

  /**
   * Load users from the JSON file
   */
  private loadUsers(): void {
    try {
      // In a real implementation, this would read from the actual file
      // For now, we'll use the current users.json data
      this.users = this.getUsersFromFile();
      console.log('User Manager: Loaded', this.users.length, 'users');
    } catch (error) {
      console.error('User Manager: Failed to load users:', error);
      this.users = [];
    }
  }

  /**
   * Get users from the current users.json file
   */
  private getUsersFromFile(): User[] {
    // This would be a file system read in a real implementation
    // For now, return the current users data
    return [
      {
        id: "1767942289962",
        email: "bashirali652@icloud.com",
        name: "ARCSTARZ Owner",
        password: "admin123",
        registrationType: "system",
        registrationSource: "owner_account",
        createdAt: "2024-01-01T00:00:00Z",
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        isOwner: true
      },
      {
        id: "1768021373282",
        name: "Bashir Ali",
        email: "najibmarere@gmail.com",
        password: "Bashir44",
        registrationType: "email",
        registrationSource: "registration_form",
        createdAt: "2026-01-10T05:02:53.282Z",
        lastLoginAt: "2026-01-14T13:03:19.046Z",
        isActive: true,
        isOwner: false
      },
      {
        id: "1768021944807",
        name: "Bashir Ali",
        email: "bashirsworldd@gmail.com",
        password: "Bashir44",
        registrationType: "email",
        registrationSource: "registration_form",
        createdAt: "2026-01-10T05:12:24.807Z",
        lastLoginAt: "2026-01-14T12:50:31.192Z",
        isActive: true,
        isOwner: false
      },
      {
        id: "1768024093295",
        name: "Fxnsi",
        email: "goattfansi566@gmail.com",
        password: "Mohamedeeq#990",
        registrationType: "email",
        registrationSource: "registration_form",
        createdAt: "2026-01-10T05:48:13.295Z",
        lastLoginAt: "2026-01-14T13:11:07.410Z",
        isActive: true,
        isOwner: false
      },
      {
        id: "1768081313627",
        name: "zeno",
        email: "trysaitama566@gmail.com",
        password: "zayid44",
        registrationType: "email",
        registrationSource: "registration_form",
        createdAt: "2026-01-10T21:41:53.627Z",
        lastLoginAt: new Date().toISOString(), // Updated to current time
        isActive: true,
        isOwner: false
      },
      {
        id: "1768224067073",
        name: "goat fansi",
        email: "fansimoha81@gmail.com",
        password: "Fansi44",
        registrationType: "email",
        registrationSource: "registration_form",
        createdAt: "2026-01-12T13:21:07.073Z",
        lastLoginAt: "2026-01-14T12:50:31.271Z",
        isActive: true,
        isOwner: false
      },
      {
        id: "google123",
        name: "Google User",
        email: "googleuser@gmail.com",
        registrationType: "google",
        registrationSource: "google_oauth",
        createdAt: "2026-01-14T12:50:09.285Z",
        lastLoginAt: "2026-01-14T12:50:09.285Z",
        isActive: true,
        isOwner: false
      }
    ];
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync(): void {
    if (!this.isBrowser) return;
    
    // Sync every 30 seconds
    setInterval(() => {
      this.processUpdates();
    }, 30000);

    // Also sync on user activity events
    this.setupActivityListeners();
  }

  /**
   * Setup listeners for user activity
   */
  private setupActivityListeners(): void {
    if (!this.isBrowser) return;
    
    // Listen for login events
    window.addEventListener('userLogin', (event: any) => {
      this.updateUserLastLogin(event.detail.userId);
    });

    // Listen for registration events
    window.addEventListener('userRegistration', (event: any) => {
      this.addUser(event.detail.user);
    });

    // Listen for user updates
    window.addEventListener('userUpdate', (event: any) => {
      this.updateUser(event.detail.userId, event.detail.updates);
    });
  }

  /**
   * Update user's last login time
   */
  public updateUserLastLogin(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.updateUser(userId, {
        lastLoginAt: new Date().toISOString()
      });
    }
  }

  /**
   * Add a new user
   */
  public addUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): void {
    const newUser: User = {
      ...userData,
      id: this.generateUserId(),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveUsers();
    console.log('User Manager: Added new user:', newUser.email);
  }

  /**
   * Update user data
   */
  public updateUser(userId: string, updates: Partial<User>): void {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const existingUser = this.users[userIndex];
      if (existingUser) {
        this.users[userIndex] = {
          ...existingUser,
          ...updates
        };
        this.saveUsers();
        console.log('User Manager: Updated user:', userId, updates);
      }
    }
  }

  /**
   * Process queued updates
   */
  private processUpdates(): void {
    if (this.isProcessing || this.updateQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('User Manager: Processing', this.updateQueue.size, 'updates');

    // Process all queued updates
    this.updateQueue.forEach((updates, userId) => {
      this.updateUser(userId, updates);
    });

    this.updateQueue.clear();
    this.isProcessing = false;
  }

  /**
   * Save users to file
   */
  private saveUsers(): void {
    try {
      // In a real implementation, this would write to the actual file
      // For now, we'll update the users.json through an API call
      this.syncToFile();
      console.log('User Manager: Saved', this.users.length, 'users to file');
    } catch (error) {
      console.error('User Manager: Failed to save users:', error);
    }
  }

  /**
   * Sync users to the actual file
   */
  private async syncToFile(): Promise<void> {
    try {
      // Call API to update the users.json file
      await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users: this.users,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('User Manager: Failed to sync to file:', error);
    }
  }

  /**
   * Generate a unique user ID
   */
  private generateUserId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }

  /**
   * Get all users
   */
  public getUsers(): User[] {
    return [...this.users];
  }

  /**
   * Get user by ID
   */
  public getUserById(userId: string): User | undefined {
    return this.users.find(u => u.id === userId);
  }

  /**
   * Get user by email
   */
  public getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  /**
   * Deactivate user
   */
  public deactivateUser(userId: string): void {
    this.updateUser(userId, { isActive: false });
  }

  /**
   * Activate user
   */
  public activateUser(userId: string): void {
    this.updateUser(userId, { isActive: true });
  }

  /**
   * Delete user
   */
  public deleteUser(userId: string): void {
    this.users = this.users.filter(u => u.id !== userId);
    this.saveUsers();
    console.log('User Manager: Deleted user:', userId);
  }

  /**
   * Get user statistics
   */
  public getUserStats(): {
    total: number;
    active: number;
    inactive: number;
    owners: number;
    recentLogins: number;
  } {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: this.users.length,
      active: this.users.filter(u => u.isActive).length,
      inactive: this.users.filter(u => !u.isActive).length,
      owners: this.users.filter(u => u.isOwner).length,
      recentLogins: this.users.filter(u => 
        new Date(u.lastLoginAt) > thirtyDaysAgo
      ).length
    };
  }
}

// Global instance
const userManager = new UserManager();

// Export for use in components
export default userManager;

// Export types
export type { User };

// Export utility functions
export const updateUserLastLogin = (userId: string) => {
  userManager.updateUserLastLogin(userId);
  // Trigger event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('userLogin', { detail: { userId } }));
  }
};

export const addNewUser = (userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => {
  userManager.addUser(userData);
  // Trigger event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('userRegistration', { detail: { user: userData } }));
  }
};

export const updateUserData = (userId: string, updates: Partial<User>) => {
  userManager.updateUser(userId, updates);
  // Trigger event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('userUpdate', { detail: { userId, updates } }));
  }
};

export const getUserStats = () => userManager.getUserStats();
export const getAllUsers = () => userManager.getUsers();
export const getUserById = (userId: string) => userManager.getUserById(userId);
export const getUserByEmail = (email: string) => userManager.getUserByEmail(email);
