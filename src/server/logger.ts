/**
 * Simple logger utility for server-side logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  message: string;
  timestamp: string;
  level: LogLevel;
  [key: string]: unknown;
}

/**
 * Formats objects for logging
 */
function formatObject(obj: unknown): string {
  try {
    return JSON.stringify(obj, (_, value) => {
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      }
      return value;
    }, 2);
  } catch (error) {
    return String(obj);
  }
}

/**
 * Logger implementation
 */
class Logger {
  private isProduction = process.env.NODE_ENV === 'production';
  
  /**
   * Log a debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }
  
  /**
   * Log an info message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }
  
  /**
   * Log an error message
   */
  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }
  
  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const logMessage: LogMessage = {
      message,
      timestamp: new Date().toISOString(),
      level,
      ...meta,
    };
    
    // In production, we might want to use a proper logging service
    if (this.isProduction) {
      // For production, we would typically send logs to a service like 
      // Winston, Pino, or a cloud logging provider
      console[level](JSON.stringify(logMessage));
    } else {
      // For development, pretty print logs
      const color = this.getConsoleColor(level);
      console[level](
        `%c${logMessage.timestamp} [${level.toUpperCase()}]:`,
        `color: ${color}; font-weight: bold`,
        message,
        meta ? formatObject(meta) : ''
      );
    }
  }
  
  /**
   * Get console color for log level
   */
  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return 'gray';
      case 'info': return 'blue';
      case 'warn': return 'orange';
      case 'error': return 'red';
      default: return 'black';
    }
  }
}

// Export singleton instance
export const logger = new Logger(); 