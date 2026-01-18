// Structured logging for production
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLog(entry: LogEntry): string {
    if (this.isProduction) {
      // Production: JSON format for log aggregation
      return JSON.stringify({
        timestamp: entry.timestamp,
        level: LogLevel[entry.level],
        message: entry.message,
        context: entry.context,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message
        } : undefined,
        requestId: entry.requestId,
        userId: entry.userId,
        ip: entry.ip
      });
    } else {
      // Development: Human-readable format
      const timestamp = new Date(entry.timestamp).toISOString();
      const level = LogLevel[entry.level].padEnd(5);
      const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const error = entry.error ? `\nError: ${entry.error.name}: ${entry.error.message}` : '';
      return `[${timestamp}] ${level} ${entry.message}${context}${error}`;
    }
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack
      } : undefined
    };
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
      console.error(this.formatLog(entry));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context);
      console.warn(this.formatLog(entry));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context);
      console.log(this.formatLog(entry));
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      console.log(this.formatLog(entry));
    }
  }

  // Request-specific logging
  logRequest(req: any, message: string, context?: Record<string, any>): void {
    const logContext = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      ...context
    };

    this.info(message, logContext);
  }

  logError(req: any, message: string, error: Error, context?: Record<string, any>): void {
    const logContext = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      ...context
    };

    this.error(message, logContext, error);
  }
}

// Export singleton instance
export const logger = new Logger();

// Health check utilities
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: 'pass' | 'fail';
    email: 'pass' | 'fail';
    memory: 'pass' | 'fail';
    disk: 'pass' | 'fail';
  };
  details?: Record<string, any>;
}

export class HealthChecker {
  private startTime: Date;
  private version: string;

  constructor() {
    this.startTime = new Date();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  async checkHealth(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      email: await this.checkEmail(),
      memory: this.checkMemory(),
      disk: await this.checkDisk()
    };

    const allHealthy = Object.values(checks).every(check => check === 'pass');

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: this.version,
      environment: process.env.NODE_ENV || 'development',
      checks,
      details: {
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
  }

  private async checkDatabase(): Promise<'pass' | 'fail'> {
    try {
      // Check if we can access the secure-users file
      const fs = require('fs');
      const path = require('path');
      const usersFile = path.join(process.cwd(), 'secure-users.json');
      
      if (fs.existsSync(usersFile)) {
        return 'pass';
      } else {
        return 'fail';
      }
    } catch (error) {
      return 'fail';
    }
  }

  private async checkEmail(): Promise<'pass' | 'fail'> {
    try {
      // Check if email credentials are set
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return 'pass';
      } else {
        return 'fail';
      }
    } catch (error) {
      return 'fail';
    }
  }

  private checkMemory(): 'pass' | 'fail' {
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    // Fail if memory usage is above 90%
    return memoryUsagePercent < 90 ? 'pass' : 'fail';
  }

  private async checkDisk(): Promise<'pass' | 'fail'> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Try to write a small test file
      const testFile = path.join(process.cwd(), '.health-check');
      fs.writeFileSync(testFile, 'health-check');
      fs.unlinkSync(testFile);
      
      return 'pass';
    } catch (error) {
      return 'fail';
    }
  }
}

export const healthChecker = new HealthChecker();

export default logger;
