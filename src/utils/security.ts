import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

/**
 * Security utilities for password hashing and data protection
 */

export class SecurityUtils {
  private static readonly SALT_ROUNDS = 12;
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }
  
  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  /**
   * Encrypt sensitive data (like emails) for storage
   */
  static encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(this.ENCRYPTION_KEY.slice(0, 32), 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }
  
  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(this.ENCRYPTION_KEY.slice(0, 32), 'hex');
    const parts = encryptedData.split(':');
    
    if (parts.length < 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0] || '', 'hex');
    const encryptedText = parts[1] || '';
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Sanitize user data for safe display (remove sensitive fields)
   */
  static sanitizeUserData(user: any): any {
    const { password, ...safeUser } = user;
    return safeUser;
  }
  
  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if email format is valid
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Generate a secure session ID
   */
  static generateSessionId(): string {
    return this.generateToken(64);
  }
}

/**
 * Rate limiting for login attempts
 */
export class RateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  
  static isLocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;
    
    if (Date.now() > record.resetTime) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return record.count >= this.MAX_ATTEMPTS;
  }
  
  static recordAttempt(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    
    if (!record) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: Date.now() + this.LOCKOUT_DURATION
      });
      return true;
    }
    
    if (Date.now() > record.resetTime) {
      record.count = 1;
      record.resetTime = Date.now() + this.LOCKOUT_DURATION;
      return true;
    }
    
    record.count++;
    return record.count < this.MAX_ATTEMPTS;
  }
  
  static getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return this.MAX_ATTEMPTS;
    }
    return Math.max(0, this.MAX_ATTEMPTS - record.count);
  }
  
  static getLockoutTimeRemaining(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    return Math.max(0, record.resetTime - Date.now());
  }
}
