import fs from 'fs';
import path from 'path';

export interface DatabaseConfig {
  usersFile: string;
  ordersFile: string;
  subscribersFile: string;
  secureUsersFile: string;
  backupDir: string;
}

export class DatabaseError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseManager {
  private static config: DatabaseConfig = {
    usersFile: path.join(process.cwd(), 'users.json'),
    ordersFile: path.join(process.cwd(), 'orders.json'),
    subscribersFile: path.join(process.cwd(), 'subscribers.json'),
    secureUsersFile: path.join(process.cwd(), 'secure-users.json'),
    backupDir: path.join(process.cwd(), 'backups')
  };

  private static ensureBackupDir(): void {
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }
  }

  private static createBackup(filePath: string): string {
    this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(filePath);
    const backupPath = path.join(this.config.backupDir, `${fileName}.${timestamp}.backup`);
    
    try {
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new DatabaseError('Backup creation failed', 'BACKUP_FAILED');
    }
  }

  private static atomicWrite(filePath: string, data: string): void {
    const tempFile = filePath + '.tmp';
    
    try {
      // Create backup before writing
      if (fs.existsSync(filePath)) {
        this.createBackup(filePath);
      }
      
      // Write to temp file
      fs.writeFileSync(tempFile, data, 'utf8');
      
      // Atomic rename
      fs.renameSync(tempFile, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      throw new DatabaseError(`Failed to write to ${filePath}`, 'WRITE_FAILED');
    }
  }

  static readUsers(): any[] {
    try {
      if (!fs.existsSync(this.config.secureUsersFile)) {
        return [];
      }
      
      const data = fs.readFileSync(this.config.secureUsersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      throw new DatabaseError('Failed to read users', 'READ_USERS_FAILED');
    }
  }

  static writeUsers(users: any[]): void {
    try {
      const data = JSON.stringify(users, null, 2);
      this.atomicWrite(this.config.secureUsersFile, data);
    } catch (error) {
      throw new DatabaseError('Failed to write users', 'WRITE_USERS_FAILED');
    }
  }

  static readOrders(): any[] {
    try {
      if (!fs.existsSync(this.config.ordersFile)) {
        return [];
      }
      
      const data = fs.readFileSync(this.config.ordersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading orders:', error);
      throw new DatabaseError('Failed to read orders', 'READ_ORDERS_FAILED');
    }
  }

  static writeOrders(orders: any[]): void {
    try {
      const data = JSON.stringify(orders, null, 2);
      this.atomicWrite(this.config.ordersFile, data);
    } catch (error) {
      throw new DatabaseError('Failed to write orders', 'WRITE_ORDERS_FAILED');
    }
  }

  static readSubscribers(): any[] {
    try {
      if (!fs.existsSync(this.config.subscribersFile)) {
        return [];
      }
      
      const data = fs.readFileSync(this.config.subscribersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading subscribers:', error);
      throw new DatabaseError('Failed to read subscribers', 'READ_SUBSCRIBERS_FAILED');
    }
  }

  static writeSubscribers(subscribers: any[]): void {
    try {
      const data = JSON.stringify(subscribers, null, 2);
      this.atomicWrite(this.config.subscribersFile, data);
    } catch (error) {
      throw new DatabaseError('Failed to write subscribers', 'WRITE_SUBSCRIBERS_FAILED');
    }
  }

  static validateData(data: any, schema: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'>): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in data)) {
        return false;
      }

      const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
      
      if (actualType !== expectedType) {
        return false;
      }
    }

    return true;
  }

  static sanitizeUser(user: any): any {
    // Remove sensitive fields and ensure required fields
    const { passwordHash, ...sanitized } = user;
    
    return {
      ...sanitized,
      id: (sanitized as any).id || '',
      email: (sanitized as any).email || '',
      name: (sanitized as any).name || '',
      role: (sanitized as any).role || 'user',
      isActive: (sanitized as any).isActive !== false,
      createdAt: (sanitized as any).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static sanitizeOrder(order: any): any {
    // Ensure required fields and proper formatting
    return {
      ...order,
      id: (order as any).id || '',
      orderNumber: (order as any).orderNumber || '',
      customerId: (order as any).customerId || '',
      customerEmail: (order as any).customerEmail || '',
      customerName: (order as any).customerName || '',
      orderDate: (order as any).orderDate || new Date().toISOString(),
      orderTotal: Number((order as any).orderTotal) || 0,
      currency: (order as any).currency || 'USD',
      status: (order as any).status || 'pending',
      paymentStatus: (order as any).paymentStatus || 'pending',
      fulfillmentStatus: (order as any).fulfillmentStatus || 'pending',
      items: Array.isArray((order as any).items) ? (order as any).items : [],
      createdAt: (order as any).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static createIndex(data: any[], field: string): Map<string, any> {
    const index = new Map<string, any>();
    
    data.forEach(item => {
      if (item && item[field]) {
        index.set(String(item[field]), item);
      }
    });
    
    return index;
  }

  static findByIndex<T>(data: T[], field: string, value: string): T | undefined {
    return data.find(item => item && (item as any)[field] === value);
  }

  static findMultipleByIndex<T>(data: T[], field: string, value: string): T[] {
    return data.filter(item => item && (item as any)[field] === value);
  }

  static cleanupOldBackups(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    try {
      this.ensureBackupDir();
      
      const files = fs.readdirSync(this.config.backupDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filePath = path.join(this.config.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old backup: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }

  static getDatabaseStats(): {
    users: number;
    orders: number;
    subscribers: number;
    lastBackup: string | null;
  } {
    const stats = {
      users: this.readUsers().length,
      orders: this.readOrders().length,
      subscribers: this.readSubscribers().length,
      lastBackup: null as string | null
    };

    try {
      this.ensureBackupDir();
      const files = fs.readdirSync(this.config.backupDir);
      
      if (files.length > 0) {
        const backupFiles = files
          .filter(file => file.endsWith('.backup'))
          .map(file => ({
            name: file,
            path: path.join(this.config.backupDir, file),
            mtime: fs.statSync(path.join(this.config.backupDir, file)).mtime
          }))
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        
        if (backupFiles.length > 0 && backupFiles[0]) {
          stats.lastBackup = backupFiles[0].name;
        }
      }
    } catch (error) {
      console.error('Error getting backup info:', error);
    }

    return stats;
  }

  static initializeDatabase(): void {
    try {
      // Ensure all data files exist
      const files = [
        this.config.secureUsersFile,
        this.config.ordersFile,
        this.config.subscribersFile
      ];

      files.forEach(file => {
        if (!fs.existsSync(file)) {
          fs.writeFileSync(file, '[]', 'utf8');
          console.log(`Created database file: ${path.basename(file)}`);
        }
      });

      // Create backup directory
      this.ensureBackupDir();
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw new DatabaseError('Database initialization failed', 'INIT_FAILED');
    }
  }
}

// Database connection pool simulation (for future database migration)
export class DatabasePool {
  private static connections: Map<string, any> = new Map();
  private static maxConnections = 10;

  static getConnection(name: string = 'default'): any {
    if (this.connections.size >= this.maxConnections) {
      throw new DatabaseError('Connection pool exhausted', 'POOL_EXHAUSTED');
    }

    if (!this.connections.has(name)) {
      this.connections.set(name, { connected: true, lastUsed: Date.now() });
    }

    return this.connections.get(name);
  }

  static releaseConnection(name: string): void {
    if (this.connections.has(name)) {
      const conn = this.connections.get(name);
      conn.lastUsed = Date.now();
    }
  }

  static cleanup(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [name, conn] of this.connections.entries()) {
      if (now - conn.lastUsed > timeout) {
        this.connections.delete(name);
        console.log(`Cleaned up connection: ${name}`);
      }
    }
  }
}

// Cleanup old backups periodically
setInterval(() => {
  DatabaseManager.cleanupOldBackups();
}, 24 * 60 * 60 * 1000); // Run daily

// Cleanup connection pool periodically
setInterval(() => {
  DatabasePool.cleanup();
}, 60 * 1000); // Run every minute
