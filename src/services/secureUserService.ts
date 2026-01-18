import * as fs from 'fs';
import * as path from 'path';
import { SecurityUtils } from '../utils/security';

// Define validation functions locally to avoid import issues
function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePasswordRequirements(password: string): { isValid: boolean; errors: string[] } {
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
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export interface SecureUser {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  registrationType: 'email' | 'google' | 'apple' | 'github';
  registrationSource: string;
  role: 'user' | 'admin';
  isActive: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password?: string;
  registrationType: 'email' | 'google' | 'apple' | 'github';
  registrationSource: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  role?: 'user' | 'admin';
}

export class SecureUserService {
  private static readonly USERS_FILE = path.join(process.cwd(), 'secure-users.json');
  private static readonly OWNER_EMAIL = 'bashirali652@icloud.com';
  private static readonly OWNER_ID = '1767942289962';

  /**
   * Initialize users file if it doesn't exist
   */
  static async initializeUsersFile(): Promise<void> {
    try {
      if (!fs.existsSync(this.USERS_FILE)) {
        // Create secure owner account
        const ownerPasswordHash = await SecurityUtils.hashPassword('admin123');
        
        const initialUsers: SecureUser[] = [
          {
            id: this.OWNER_ID,
            email: this.OWNER_EMAIL,
            name: 'ARCSTARZ Owner',
            passwordHash: ownerPasswordHash,
            registrationType: 'email',
            registrationSource: 'owner_account',
            role: 'admin',
            isActive: true,
            isOwner: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            failedLoginAttempts: 0,
            emailVerified: true
          }
        ];

        fs.writeFileSync(this.USERS_FILE, JSON.stringify(initialUsers, null, 2));
        console.log('✅ Secure users database initialized with owner account');
      }
    } catch (error) {
      console.error('❌ Failed to initialize users file:', error);
      throw error;
    }
  }

  /**
   * Read users from secure storage
   */
  private static readUsers(): SecureUser[] {
    try {
      const data = fs.readFileSync(this.USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error reading users:', error);
      return [];
    }
  }

  /**
   * Write users to secure storage with atomic operation
   */
  private static writeUsers(users: SecureUser[]): boolean {
    try {
      const tempFile = this.USERS_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(users, null, 2));
      fs.renameSync(tempFile, this.USERS_FILE);
      return true;
    } catch (error) {
      console.error('❌ Error writing users:', error);
      return false;
    }
  }

  /**
   * Validate user input data
   */
  private static validateUserInput(data: CreateUserRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Name validation
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (data.name && data.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }

    // Email validation
    if (!data.email || !validateEmailFormat(data.email)) {
      errors.push('Valid email address is required');
    }

    // Password validation for email registrations
    if (data.registrationType === 'email') {
      if (!data.password) {
        errors.push('Password is required for email registration');
      } else {
        const passwordValidation = validatePasswordRequirements(data.password);
        if (!passwordValidation.isValid) {
          errors.push(...passwordValidation.errors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new user with comprehensive validation
   */
  static async createUser(userData: CreateUserRequest): Promise<{ success: boolean; user?: SecureUser; error?: string }> {
    try {
      // Validate input
      const validation = this.validateUserInput(userData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const users = this.readUsers();

      // Check for duplicate email
      const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
      if (existingUser) {
        return {
          success: false,
          error: 'Email already registered'
        };
      }

      // Hash password for email registrations
      let passwordHash: string | undefined;
      if (userData.registrationType === 'email' && userData.password) {
        passwordHash = await SecurityUtils.hashPassword(userData.password);
      }

      // Determine role and ownership
      const isOwner = userData.email.toLowerCase().trim() === this.OWNER_EMAIL.toLowerCase();
      const role = isOwner ? 'admin' : 'user';

      // Create new user
      const newUser: SecureUser = {
        id: Date.now().toString(),
        email: userData.email.toLowerCase().trim(),
        name: userData.name.trim(),
        passwordHash,
        registrationType: userData.registrationType,
        registrationSource: userData.registrationSource,
        role,
        isActive: true,
        isOwner,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        emailVerified: userData.registrationType !== 'email' // OAuth users are pre-verified
      };

      // Atomic write operation
      users.push(newUser);
      if (!this.writeUsers(users)) {
        return {
          success: false,
          error: 'Failed to save user data'
        };
      }

      console.log('✅ User created successfully:', newUser.email);
      return {
        success: true,
        user: newUser
      };

    } catch (error) {
      console.error('❌ Error creating user:', error);
      return {
        success: false,
        error: 'User creation failed'
      };
    }
  }

  /**
   * Authenticate user with comprehensive security checks
   */
  static async authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: SecureUser; error?: string }> {
    try {
      const users = this.readUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check if account is locked
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const lockoutTime = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
        return {
          success: false,
          error: `Account locked. Try again in ${lockoutTime} minutes`
        };
      }

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated'
        };
      }

      // Verify password based on registration type
      let isValidPassword = false;
      
      if (user.registrationType === 'google') {
        // OAuth users don't need password verification
        isValidPassword = true;
      } else if (user.passwordHash) {
        // Secure password verification with constant-time comparison
        isValidPassword = await SecurityUtils.verifyPassword(password, user.passwordHash);
      } else {
        // No password hash found
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      if (isValidPassword) {
        // Reset failed attempts on successful login
        const updatedUsers = users.map(u => 
          u.id === user.id 
            ? {
                ...u,
                lastLoginAt: new Date().toISOString(),
                failedLoginAttempts: 0,
                lockedUntil: undefined,
                updatedAt: new Date().toISOString()
              }
            : u
        );

        if (this.writeUsers(updatedUsers)) {
          console.log('✅ User authenticated successfully:', user.email);
          return {
            success: true,
            user
          };
        } else {
          return {
            success: false,
            error: 'Authentication failed'
          };
        }
      } else {
        // Increment failed attempts
        const updatedUsers = users.map(u => {
          if (u.id === user.id) {
            const newFailedAttempts = u.failedLoginAttempts + 1;
            const shouldLock = newFailedAttempts >= 5;
            
            return {
              ...u,
              failedLoginAttempts: newFailedAttempts,
              lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : undefined,
              updatedAt: new Date().toISOString()
            };
          }
          return u;
        });

        this.writeUsers(updatedUsers);
        
        console.log('❌ Authentication failed - invalid password:', email);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

    } catch (error) {
      console.error('❌ Error during authentication:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Get user by ID (sanitized)
   */
  static getUserById(userId: string): SecureUser | null {
    try {
      const users = this.readUsers();
      const user = users.find(u => u.id === userId);
      
      if (user) {
        // Return sanitized user data
        const { passwordHash, ...sanitizedUser } = user;
        return sanitizedUser as SecureUser;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Get all users (admin only)
   */
  static getAllUsers(): SecureUser[] {
    try {
      const users = this.readUsers();
      // Return sanitized user data
      return users.map(user => {
        const { passwordHash, ...sanitizedUser } = user;
        return sanitizedUser as SecureUser;
      });
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }

  /**
   * Update user data
   */
  static async updateUser(userId: string, updates: UpdateUserRequest): Promise<{ success: boolean; user?: SecureUser; error?: string }> {
    try {
      const users = this.readUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user = users[userIndex];

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Validate email uniqueness if updating email
      if (updates.email && updates.email !== user.email) {
        if (!validateEmailFormat(updates.email)) {
          return {
            success: false,
            error: 'Invalid email format'
          };
        }

        const existingUser = users.find(u => u.email.toLowerCase() === updates.email!.toLowerCase() && u.id !== userId);
        if (existingUser) {
          return {
            success: false,
            error: 'Email already registered'
          };
        }
      }

      // Validate password if updating
      if (updates.password) {
        const passwordValidation = validatePasswordRequirements(updates.password);
        if (!passwordValidation.isValid) {
          return {
            success: false,
            error: passwordValidation.errors.join(', ')
          };
        }
        // Add passwordHash to updates object
        (updates as any).passwordHash = await SecurityUtils.hashPassword(updates.password);
      }

      // Prevent role escalation for non-owners
      if (updates.role && !user.isOwner) {
        return {
          success: false,
          error: 'Cannot modify user role'
        };
      }

      // Apply updates
      const updatedUser: SecureUser = {
        ...user,
        ...updates,
        id: user.id, // Ensure id is not undefined
        updatedAt: new Date().toISOString()
      };

      users[userIndex] = updatedUser;

      if (this.writeUsers(users)) {
        console.log('✅ User updated successfully:', updatedUser.email);
        const { passwordHash, ...sanitizedUser } = updatedUser;
        return {
          success: true,
          user: sanitizedUser as SecureUser
        };
      } else {
        return {
          success: false,
          error: 'Failed to update user'
        };
      }

    } catch (error) {
      console.error('❌ Error updating user:', error);
      return {
        success: false,
        error: 'User update failed'
      };
    }
  }
}
