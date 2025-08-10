/**
 * CORS Middleware
 * 
 * Cross-Origin Resource Sharing middleware for AgentUI Auth Service
 * Law of Adaptive Governance: Support cross-origin requests
 */

import { Request, Response, NextFunction } from 'express';

/**
 * CORS configuration options
 */
export interface CORSOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * CORS Middleware
 * Law of Procedural Integrity: Standardized CORS handling
 */
export class CORSMiddleware {
  private options: CORSOptions;
  
  constructor(options: CORSOptions = {}) {
    this.options = {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Correlation-ID',
        'X-API-Key',
        'X-Requested-With'
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
      ...options
    };
  }
  
  /**
   * CORS middleware handler
   * Law of Adaptive Governance: Flexible origin handling
   */
  handler() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Handle origin
      if (this.options.origin === true) {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      } else if (typeof this.options.origin === 'string') {
        res.header('Access-Control-Allow-Origin', this.options.origin);
      } else if (Array.isArray(this.options.origin)) {
        const origin = req.headers.origin;
        if (origin && this.options.origin.includes(origin)) {
          res.header('Access-Control-Allow-Origin', origin);
        }
      }
      
      // Handle methods
      if (this.options.methods) {
        res.header('Access-Control-Allow-Methods', this.options.methods.join(', '));
      }
      
      // Handle headers
      if (this.options.allowedHeaders) {
        res.header('Access-Control-Allow-Headers', this.options.allowedHeaders.join(', '));
      }
      
      // Handle credentials
      if (this.options.credentials) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      
      // Handle max age
      if (this.options.maxAge) {
        res.header('Access-Control-Max-Age', this.options.maxAge.toString());
      }
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      
      next();
    };
  }
}

