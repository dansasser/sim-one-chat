/**
 * Logging Middleware
 * 
 * Request/response logging middleware for AgentUI Auth Service
 * Law of Recursive Validation: Monitor all requests for security
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Logging configuration options
 */
export interface LoggingOptions {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logRequests?: boolean;
  logResponses?: boolean;
  logHeaders?: boolean;
  logBody?: boolean;
  sensitiveFields?: string[];
}

/**
 * Request log entry
 */
export interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  headers?: Record<string, any>;
  body?: any;
  ip?: string;
  userAgent?: string;
  correlationId?: string;
}

/**
 * Response log entry
 */
export interface ResponseLog {
  timestamp: string;
  statusCode: number;
  duration: number;
  headers?: Record<string, any>;
  body?: any;
  correlationId?: string;
}

/**
 * Logging Middleware
 * Law of Procedural Integrity: Structured request logging
 */
export class LoggingMiddleware {
  private options: LoggingOptions;
  
  constructor(options: LoggingOptions = {}) {
    this.options = {
      logLevel: 'info',
      logRequests: true,
      logResponses: true,
      logHeaders: false,
      logBody: false,
      sensitiveFields: ['password', 'apiKey', 'token', 'secret', 'authorization'],
      ...options
    };
  }
  
  /**
   * Logging middleware handler
   * Law of Recursive Validation: Log all requests for monitoring
   */
  handler() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();
      
      // Add correlation ID to request
      req.headers['x-correlation-id'] = correlationId;
      
      // Log request
      if (this.options.logRequests) {
        this.logRequest(req, correlationId);
      }
      
      // Capture original response methods
      const originalSend = res.send;
      const originalJson = res.json;
      let responseBody: any;
      
      // Override response methods to capture response data
      res.send = function(body: any) {
        responseBody = body;
        return originalSend.call(this, body);
      };
      
      res.json = function(body: any) {
        responseBody = body;
        return originalJson.call(this, body);
      };
      
      // Log response when finished
      res.on('finish', () => {
        if (this.options.logResponses) {
          const duration = Date.now() - startTime;
          this.logResponse(res, responseBody, duration, correlationId);
        }
      });
      
      next();
    };
  }
  
  /**
   * Log incoming request
   * Law of Contextual Coherence: Preserve request context
   */
  private logRequest(req: Request, correlationId: string): void {
    const requestLog: RequestLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId
    };
    
    if (this.options.logHeaders) {
      requestLog.headers = this.sanitizeData(req.headers);
    }
    
    if (this.options.logBody && req.body) {
      requestLog.body = this.sanitizeData(req.body);
    }
    
    this.log('info', '📥 Request', requestLog);
  }
  
  /**
   * Log outgoing response
   * Law of Recursive Validation: Monitor response patterns
   */
  private logResponse(res: Response, body: any, duration: number, correlationId: string): void {
    const responseLog: ResponseLog = {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      duration,
      correlationId
    };
    
    if (this.options.logHeaders) {
      responseLog.headers = this.sanitizeData(res.getHeaders());
    }
    
    if (this.options.logBody && body) {
      responseLog.body = this.sanitizeData(body);
    }
    
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    const emoji = res.statusCode >= 400 ? '❌' : '✅';
    
    this.log(logLevel, `${emoji} Response`, responseLog);
  }
  
  /**
   * Sanitize sensitive data from logs
   * Law of Procedural Integrity: Protect sensitive information
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sanitized = { ...data };
    
    for (const field of this.options.sensitiveFields || []) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
      
      // Handle nested objects
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
    }
    
    return sanitized;
  }
  
  /**
   * Generate correlation ID
   * Law of Contextual Coherence: Unique request tracking
   */
  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * Log message with level
   * Law of Recursive Validation: Structured logging
   */
  private log(level: string, message: string, data?: any): void {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'agentui-auth-service',
      ...data
    };
    
    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(logEntry, null, 2));
        break;
      case 'info':
        console.info(JSON.stringify(logEntry, null, 2));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry, null, 2));
        break;
      case 'error':
        console.error(JSON.stringify(logEntry, null, 2));
        break;
      default:
        console.log(JSON.stringify(logEntry, null, 2));
    }
  }
}

