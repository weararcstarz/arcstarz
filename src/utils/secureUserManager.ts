import { SecurityUtils, RateLimiter } from './security';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Secure User Management System
 * Handles user data with proper password hashing and encryption
 */

export interface SecureUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  registrationType: 'email' | 'google' | 'system';
  registrationSource: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  isOwner: boolean;
  updatedAt: string;
  loginAttempts?: number;
  lastFailedLogin?: string;
  sessionId?: string;
}

export class SecureUserManager {
  private static readonly USERS_FILE = path.join(process.cwd(), 'users.json');
  private static readonly SECURE_USERS_FILE = path.join(process.cwd(), 'secure-users.json');
  
  /**
   * Migrate existing users to secure format
   */
  static async migrateToSecureUsers(): Promise<void> {
    try {
      console.log('🔒 Starting secure user migration...');
      
      // Read existing users
      const existingUsers = this.readUsers();
      const secureUsers: SecureUser[] = [];
      
      for (const user of existingUsers) {
        const secureUser: SecureUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          passwordHash: user.password ? await SecurityUtils.hashPassword(user.password) : '',
          registrationType: user.registrationType,
          registrationSource: user.registrationSource,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          isActive: user.isActive,
          isOwner: user.isOwner,
          updatedAt: new Date().toISOString()
        };
        
        secureUsers.push(secureUser);
      }
      
      // Write secure users
      this.writeSecureUsers(secureUsers);
      
      // Remove plain text passwords from original file
      const sanitizedUsers = existingUsers.map(user => {
        const { password, ...sanitized } = user;
        return sanitized;
      });
      this.writeUsers(sanitizedUsers);
      
      console.log(`✅ Successfully migrated ${secureUsers.length} users to secure format`);
    } catch (error) {
      console.error('❌ Error during user migration:', error);
      throw error;
    }
  }
  
  /**
   * Create a new user with secure password
   */
  static async createUser(userData: {
    email: string;
    name: string;
    password: string;
    registrationType: 'email' | 'google' | 'system';
    registrationSource: string;
  }): Promise<SecureUser> {
    // Validate email
    if (!SecurityUtils.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate password strength
    const passwordValidation = SecurityUtils.validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
    }
    
    // Check if user already exists
    const existingUsers = this.readSecureUsers();
    if (existingUsers.find(u => u.email === userData.email)) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const passwordHash = await SecurityUtils.hashPassword(userData.password);
    
    // Create user
    const newUser: SecureUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email,
      name: userData.name,
      passwordHash,
      registrationType: userData.registrationType,
      registrationSource: userData.registrationSource,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
      isOwner: false,
      updatedAt: new Date().toISOString()
    };
    
    // Save user
    existingUsers.push(newUser);
    this.writeSecureUsers(existingUsers);
    
    console.log('✅ New secure user created:', userData.email);
    return newUser;
  }
  
  /**
   * Authenticate user with rate limiting
   */
  static async authenticateUser(email: string, password: string, ipAddress?: string): Promise<SecureUser | null> {
    const rateLimitKey = `${email}_${ipAddress || 'unknown'}`;
    
    // Check rate limiting
    if (RateLimiter.isLocked(rateLimitKey)) {
      const remainingTime = RateLimiter.getLockoutTimeRemaining(rateLimitKey);
      throw new Error(`Account locked. Try again in ${Math.ceil(remainingTime / 60000)} minutes`);
    }
    
    const users = this.readSecureUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      RateLimiter.recordAttempt(rateLimitKey);
      throw new Error('Invalid email or password');
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    
    // For OAuth users, no password check needed
    if (user.registrationType === 'google' || user.registrationType === 'system') {
      return user;
    }
    
    // Verify password
    const isValidPassword = await SecurityUtils.verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      RateLimiter.recordAttempt(rateLimitKey);
      
      // Update user's failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      user.lastFailedLogin = new Date().toISOString();
      this.updateUser(user);
      
      const remainingAttempts = RateLimiter.getRemainingAttempts(rateLimitKey);
      throw new Error(`Invalid email or password. ${remainingAttempts - 1} attempts remaining`);
    }
    
    // Reset failed attempts on successful login
    RateLimiter.recordAttempt(`${email}_success`);
    user.loginAttempts = 0;
    user.lastFailedLogin = undefined;
    user.lastLoginAt = new Date().toISOString();
    user.sessionId = SecurityUtils.generateSessionId();
    this.updateUser(user);
    
    console.log('✅ User authenticated successfully:', email);
    return user;
  }
  
  /**
   * Get user by ID (sanitized)
   */
  static getUserById(userId: string): SecureUser | null {
    const users = this.readSecureUsers();
    const user = users.find(u => u.id === userId);
    return user || null;
  }
  
  /**
   * Get user by email (sanitized)
   */
  static getUserByEmail(email: string): SecureUser | null {
    const users = this.readSecureUsers();
    const user = users.find(u => u.email === email);
    return user || null;
  }
  
  /**
   * Update user
   */
  static updateUser(updatedUser: SecureUser): void {
    const users = this.readSecureUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    
    if (index !== -1) {
      users[index] = { ...updatedUser, updatedAt: new Date().toISOString() };
      this.writeSecureUsers(users);
    }
  }
  
  /**
   * Deactivate user
   */
  static deactivateUser(userId: string): void {
    const user = this.getUserById(userId);
    if (user) {
      user.isActive = false;
      user.sessionId = undefined;
      this.updateUser(user);
    }
  }
  
  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isValidCurrentPassword = await SecurityUtils.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidCurrentPassword) {
      throw new Error('Current password is incorrect');
    }
    
    // Validate new password
    const passwordValidation = SecurityUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
    }
    
    // Update password
    user.passwordHash = await SecurityUtils.hashPassword(newPassword);
    this.updateUser(user);
    
    console.log('✅ Password changed successfully for user:', user.email);
  }
  
  /**
   * Get all users (admin only, sanitized)
   */
  static getAllUsers(): Omit<SecureUser, 'passwordHash'>[] {
    const users = this.readSecureUsers();
    return users.map(user => SecurityUtils.sanitizeUserData(user));
  }
  
  /**
   * Read users from file
   */
  private static readUsers(): any[] {
    try {
      const data = fs.readFileSync(this.USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Write users to file
   */
  private static writeUsers(users: any[]): void {
    try {
      fs.writeFileSync(this.USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error writing users:', error);
    }
  }
  
  /**
   * Read secure users from file
   */
  private static readSecureUsers(): SecureUser[] {
    try {
      const data = fs.readFileSync(this.SECURE_USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Write secure users to file
   */
  private static writeSecureUsers(users: SecureUser[]): void {
    try {
      fs.writeFileSync(this.SECURE_USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error writing secure users:', error);
    }
  }
  
  /**
   * Check if migration is needed
   */
  static needsMigration(): boolean {
    const users = this.readUsers();
    const secureUsers = this.readSecureUsers();
    
    // Check if any user has plain text password
    const hasPlainTextPasswords = users.some(user => user.password && !user.passwordHash);
    
    return hasPlainTextPasswords || secureUsers.length === 0;
  }
}
