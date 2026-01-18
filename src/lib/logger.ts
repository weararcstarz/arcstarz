import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private static logFile: string = path.join(process.cwd(), 'logs', 'app.log');
  private static errorFile: string = path.join(process.cwd(), 'logs', 'error.log');
  private static maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private static maxFiles: number = 5;
  
  private static ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  private static shouldRotate(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      const stats = fs.statSync(filePath);
      return stats.size >= this.maxFileSize;
    } catch {
      return false;
    }
  }
  
  private static rotateLogFile(filePath: string): void {
    try {
      if (!fs.existsSync(filePath)) {
        return;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = path.extname(filePath);
      const name = path.basename(filePath, ext);
      const dir = path.dirname(filePath);
      
      const backupPath = path.join(dir, `${name}.${timestamp}${ext}`);
      
      fs.renameSync(filePath, backupPath);
      
      // Clean up old log files
      this.cleanupOldLogs(dir, name, ext);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }
  
  private static cleanupOldLogs(dir: string, baseName: string, ext: string): void {
    try {
      const files = fs.readdirSync(dir)
        .filter(file => file.startsWith(baseName) && file.endsWith(ext))
        .map(file => ({
          name: file,
          path: path.join(dir, file),
          mtime: fs.statSync(path.join(dir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      // Keep only the most recent files
      const filesToKeep = files.slice(0, this.maxFiles - 1);
      const filesToDelete = files.slice(this.maxFiles - 1);
      
      filesToDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`Cleaned up old log file: ${file.name}`);
        } catch (error) {
          console.error(`Failed to delete old log file ${file.name}:`, error);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }
  
  private static formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, userId, requestId, ip, userAgent, error } = entry;
    
    let logLine = `[${timestamp}] ${level}: ${message}`;
    
    if (userId) logLine += ` [User: ${userId}]`;
    if (requestId) logLine += ` [Request: ${requestId}]`;
    if (ip) logLine += ` [IP: ${ip}]`;
    
    if (context && Object.keys(context).length > 0) {
      logLine += ` Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      logLine += ` Error: ${error.name}: ${error.message}`;
      if (error.stack && process.env.NODE_ENV === 'development') {
        logLine += `\nStack: ${error.stack}`;
      }
    }
    
    return logLine;
  }
  
  private static writeLog(entry: LogEntry): void {
    this.ensureLogDirectory();
    
    const logLine = this.formatLogEntry(entry);
    const logFile = entry.level === LogLevel.ERROR ? this.errorFile : this.logFile;
    
    // Rotate if necessary
    if (this.shouldRotate(logFile)) {
      this.rotateLogFile(logFile);
    }
    
    // Write to file
    try {
      fs.appendFileSync(logFile, logLine + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
    
    // Also output to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = entry.level === LogLevel.ERROR ? 'error' :
                         entry.level === LogLevel.WARN ? 'warn' :
                         entry.level === LogLevel.DEBUG ? 'debug' : 'log';
      
      console[consoleMethod](logLine);
    } else {
      // In production, only log errors and warnings to console
      if (entry.level === LogLevel.ERROR || entry.level === LogLevel.WARN) {
        console[entry.level === LogLevel.ERROR ? 'error' : 'warn'](logLine);
      }
    }
  }
  
  public static error(message: string, context?: Record<string, any>, error?: Error): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
  
  public static warn(message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context
    });
  }
  
  public static info(message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context
    });
  }
  
  public static debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog({
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        context
      });
    }
  }
  
  // Request logging helper
  public static logRequest(req: any, res?: any, startTime?: number): void {
    const context: Record<string, any> = {
      method: req.method,
      url: req.url,
      statusCode: res?.statusCode,
      duration: startTime ? Date.now() - startTime : undefined
    };
    
    const logLevel = res?.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: logLevel,
      message: `${req.method} ${req.url}${res ? ` - ${res.statusCode}` : ''}`,
      context,
      ip: req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
      userAgent: req.headers['user-agent']
    });
  }
  
  // Security event logging
  public static logSecurityEvent(event: string, details: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message: `SECURITY: ${event}`,
      context: details
    });
  }
  
  // Payment event logging
  public static logPaymentEvent(event: string, details: Record<string, any>): void {
    const level = event.includes('FAILED') || event.includes('ERROR') ? LogLevel.ERROR : LogLevel.INFO;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      message: `PAYMENT: ${event}`,
      context: details
    });
  }
  
  // Database operation logging
  public static logDatabase(operation: string, table: string, details?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message: `DATABASE: ${operation} on ${table}`,
      context: details
    });
  }
  
  // Performance logging
  public static logPerformance(operation: string, duration: number, details?: Record<string, any>): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.INFO;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      message: `PERFORMANCE: ${operation} took ${duration}ms`,
      context: details
    });
  }
  
  // Health check logging
  public static logHealth(status: 'UP' | 'DOWN', details?: Record<string, any>): void {
    const level = status === 'DOWN' ? LogLevel.ERROR : LogLevel.INFO;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      message: `HEALTH: ${status}`,
      context: details
    });
  }
  
  // Get log statistics
  public static getLogStats(): {
    logFileSize: number;
    errorFileSize: number;
    logFileExists: boolean;
    errorFileExists: boolean;
    lastLogEntry: string | null;
    lastErrorEntry: string | null;
  } | null {
    try {
      const stats = {
        logFileSize: 0,
        errorFileSize: 0,
        logFileExists: fs.existsSync(this.logFile),
        errorFileExists: fs.existsSync(this.errorFile),
        lastLogEntry: null as string | null,
        lastErrorEntry: null as string | null
      };
      
      if (stats.logFileExists) {
        stats.logFileSize = fs.statSync(this.logFile).size;
        const content = fs.readFileSync(this.logFile, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        stats.lastLogEntry = lines[lines.length - 1] || null;
      }
      
      if (stats.errorFileExists) {
        stats.errorFileSize = fs.statSync(this.errorFile).size;
        const content = fs.readFileSync(this.errorFile, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        stats.lastErrorEntry = lines[lines.length - 1] || null;
      }
      
      return stats;
    } catch (error) {
      this.error('Failed to get log stats', { error: (error as Error).message });
      return null;
    }
  }
  
  // Initialize logger
  public static initialize(): void {
    this.ensureLogDirectory();
    console.log('✅ Logger initialized');
  }
}

// Express middleware for request logging
export function requestLogger(req: any, res: any, next: any) {
  const startTime = Date.now();
  
  // Override res.end to log when request completes
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    Logger.logRequest(req, res, startTime);
    originalEnd.apply(res, args);
  };
  
  next();
}

// Error handling middleware
export function errorHandler(error: Error, req: any, res: any, next: any) {
  Logger.error('Unhandled error', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  }, error);
  
  // Don't send stack traces in production
  const response = {
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  };
  
  res.status(500).json(response);
}

// Graceful shutdown handler
export function handleShutdown(signal: string): void {
  Logger.info(`Received ${signal}, starting graceful shutdown`);
  
  // Close database connections, clear caches, etc.
  setTimeout(() => {
    Logger.info('Graceful shutdown completed');
    process.exit(0);
  }, 5000);
}

// Set up graceful shutdown handlers
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGUSR2', () => handleShutdown('SIGUSR2'));
