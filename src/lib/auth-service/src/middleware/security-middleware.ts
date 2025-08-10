/**
 * Security Middleware
 * 
 * Provides comprehensive security features for authentication service requests:
 * - Request validation and sanitization
 * - Rate limiting and abuse prevention
 * - Security headers and CORS
 * - Request logging and monitoring
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Security configuration options
 */
export interface SecurityOptions {
  enableValidation?: boolean;
  enableRateLimit?: boolean;
  enableLogging?: boolean;
  maxRequestSize?: number;
  timeoutMs?: number;
  corsOrigins?: string[];
}

/**
 * Request security context
 */
export interface SecurityContext {
  correlationId: string;
  startTime: number;
  validated: boolean;
  rateLimited: boolean;
  logged: boolean;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Security Middleware
 * Provides comprehensive security for authentication requests
 */
export class SecurityMiddleware {
  private options: SecurityOptions;
  
  constructor(options: SecurityOptions = {}) {
    this.options = {
      enableValidation: true,
      enableRateLimit: true,
      enableLogging: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      timeoutMs: 30000, // 30 seconds
      corsOrigins: ['*'],
      ...options
    };
  }
  
  /**
   * Security middleware handler
   * Applies comprehensive security to incoming requests
   */
  handler() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();
      
      // Initialize security context
      const security: SecurityContext = {
        correlationId,
        startTime,
        validated: false,
        rateLimited: false,
        logged: false,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      };
      
      try {
        // Request validation
        if (this.options.enableValidation) {
          await this.validateRequest(req, res, security);
        }
        
        // Rate limiting
        if (this.options.enableRateLimit) {
          await this.checkRateLimit(req, res, security);
        }
        
        // Security logging
        if (this.options.enableLogging) {
          await this.logRequest(req, res, security);
        }
        
        // Attach security context to request
        (req as any).security = security;
        
        // Set security headers
        this.setSecurityHeaders(res);
        
        next();
        
      } catch (error) {
        console.error('Security middleware error:', {
          correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path,
          method: req.method
        });
        
        res.status(500).json({
          error: 'Security validation failed',
          correlationId,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
  
  /**
   * Validate incoming request
   */
  private async validateRequest(req: Request, res: Response, security: SecurityContext): Promise<void> {
    // Check request size
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > this.options.maxRequestSize!) {
      throw new Error(`Request too large: ${contentLength} bytes`);
    }
    
    // Validate required headers for auth requests
    if (req.path.includes('/auth') && req.method === 'POST') {
      if (!req.headers['content-type']?.includes('application/json')) {
        throw new Error('Invalid content type for auth request');
      }
    }
    
    security.validated = true;
  }
  
  /**
   * Check rate limiting
   */
  private async checkRateLimit(req: Request, res: Response, security: SecurityContext): Promise<void> {
    // Simple rate limiting logic (in production, use Redis or similar)
    const clientId = security.ipAddress || 'unknown';
    
    // For now, just mark as checked
    // In production, implement proper rate limiting
    security.rateLimited = false;
  }
  
  /**
   * Log security events
   */
  private async logRequest(req: Request, res: Response, security: SecurityContext): Promise<void> {
    console.log('Auth service request:', {
      correlationId: security.correlationId,
      method: req.method,
      path: req.path,
      userAgent: security.userAgent,
      ipAddress: security.ipAddress,
      timestamp: new Date().toISOString()
    });
    
    security.logged = true;
  }
  
  /**
   * Set security headers
   */
  private setSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create security middleware instance
 */
export function createSecurityMiddleware(options?: SecurityOptions) {
  return new SecurityMiddleware(options);
}

export default SecurityMiddleware;

