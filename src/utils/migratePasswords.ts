import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple password migration utility
 * Converts plain text passwords to bcrypt hashes
 */

interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  registrationType: string;
  registrationSource: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  isOwner: boolean;
  updatedAt: string;
}

interface SecureUser extends User {
  passwordHash?: string;
}

export async function migratePasswordsToHash(): Promise<void> {
  try {
    console.log('🔒 Starting password migration...');
    
    const usersFile = path.join(process.cwd(), 'users.json');
    const secureUsersFile = path.join(process.cwd(), 'secure-users.json');
    
    // Read existing users
    const usersData = fs.readFileSync(usersFile, 'utf8');
    const users: User[] = JSON.parse(usersData);
    
    console.log(`📊 Found ${users.length} users to migrate`);
    
    // Migrate users with passwords
    const secureUsers: SecureUser[] = [];
    let migratedCount = 0;
    
    for (const user of users) {
      const secureUser: SecureUser = { ...user };
      
      if (user.password && user.registrationType === 'email') {
        // Hash the password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(user.password, saltRounds);
        
        secureUser.passwordHash = passwordHash;
        delete secureUser.password; // Remove plain text password
        
        migratedCount++;
        console.log(`✅ Migrated user: ${user.email}`);
      } else if (user.registrationType === 'google' || user.registrationType === 'system') {
        // OAuth users don't need passwords
        delete secureUser.password;
        console.log(`🔓 OAuth user: ${user.email} (no password needed)`);
      }
      
      secureUsers.push(secureUser);
    }
    
    // Write secure users file
    fs.writeFileSync(secureUsersFile, JSON.stringify(secureUsers, null, 2));
    
    // Update original users file to remove passwords
    const sanitizedUsers = users.map(user => {
      const { password, ...sanitized } = user;
      return sanitized;
    });
    fs.writeFileSync(usersFile, JSON.stringify(sanitizedUsers, null, 2));
    
    console.log(`🎉 Successfully migrated ${migratedCount} users with passwords`);
    console.log(`📁 Secure users saved to: secure-users.json`);
    console.log(`🗑️  Plain text passwords removed from: users.json`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Function to verify a password against the hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Function to create a new password hash
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Run migration if this file is executed directly
if (require.main === module) {
  migratePasswordsToHash().catch(console.error);
}
