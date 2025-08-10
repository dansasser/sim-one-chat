/**
 * Logger utility for frontend SDK
 * 
 * Provides structured logging with metadata tracking and
 * comprehensive debugging capabilities for frontend applications.
 */

/**
 * Log level enumeration
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  correlationId?: string;
  sessionId?: string;
  data?: any;
  metadata?: {
    source?: string;
    component?: string;
    action?: string;
    userId?: string;
  };
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  enableConsole?: boolean;
  enableStorage?: boolean;
  maxEntries?: number;
}

/**
 * Frontend SDK Logger
 * Provides comprehensive logging for debugging and monitoring
 */
export class Logger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];
  private readonly maxEntries: number;

  constructor(config: LoggerConfig) {
    this.config = {
      enableConsole: true,
      enableStorage: true,
      maxEntries: 1000,
      ...config
    };
    this.maxEntries = this.config.maxEntries || 1000;
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  public error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.config.enabled) return;

    // Check log level
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    if (messageLevelIndex < currentLevelIndex) return;

    // Create log entry
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      data,
      metadata: {
        source: 'agentui-sdk',
        component: data?.component || 'unknown',
        action: data?.action || 'log'
      }
    };

    // Store entry
    if (this.config.enableStorage) {
      this.entries.push(entry);
      
      // Maintain max entries limit
      if (this.entries.length > this.maxEntries) {
        this.entries = this.entries.slice(-this.maxEntries);
      }
    }

    // Output to console
    if (this.config.enableConsole) {
      const timestamp = new Date(entry.timestamp).toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'debug':
          console.debug(prefix, message, data || '');
          break;
        case 'info':
          console.info(prefix, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, message, data || '');
          break;
        case 'error':
          console.error(prefix, message, data || '');
          break;
      }
    }
  }

  /**
   * Get recent log entries
   */
  public getEntries(limit?: number): LogEntry[] {
    const entries = this.entries.slice();
    return limit ? entries.slice(-limit) : entries;
  }

  /**
   * Get entries by level
   */
  public getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }

  /**
   * Clear all log entries
   */
  public clear(): void {
    this.entries = [];
  }

  /**
   * Get logger statistics
   */
  public getStats(): {
    totalEntries: number;
    entriesByLevel: Record<LogLevel, number>;
    oldestEntry?: number;
    newestEntry?: number;
  } {
    const stats = {
      totalEntries: this.entries.length,
      entriesByLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0
      } as Record<LogLevel, number>,
      oldestEntry: undefined as number | undefined,
      newestEntry: undefined as number | undefined
    };

    this.entries.forEach(entry => {
      stats.entriesByLevel[entry.level]++;
    });

    if (this.entries.length > 0) {
      stats.oldestEntry = this.entries[0].timestamp;
      stats.newestEntry = this.entries[this.entries.length - 1].timestamp;
    }

    return stats;
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify({
      config: this.config,
      stats: this.getStats(),
      entries: this.entries
    }, null, 2);
  }

  /**
   * Update logger configuration
   */
  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

