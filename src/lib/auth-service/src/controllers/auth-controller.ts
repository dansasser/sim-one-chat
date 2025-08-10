/**
 * Authentication Controller
 * 
 * REST API controller for authentication endpoints with reliable API design
 * and comprehensive security features.
 */

import { Request, Response } from 'express';
import { AuthService, AuthResult } from '../services/auth-service';
import { 
  AuthConfig, 
  AuthMethod, 
  APIKeyConfig, 
  JWTConfig, 
  OAuth2Config,
  AgentUIErrorFactory,
  ErrorCode
} from '../types/auth-types';

/**
 * Authentication Controller
 * Law of Procedural Integrity: Structured API endpoints
 */
export class AuthController {
  private authService: AuthService;
  
  constructor(authService: AuthService) {
    this.authService = authService;
  }
  
  /**
   * API Key Authentication Endpoint
   * Law of Recursive Validation: Validate request and authenticate
   */
  async authenticateAPIKey(req: Request, res: Response): Promise<void> {
    try {
      const { apiKey, permissions } = req.body;
      
      if (!apiKey) {
        res.status(400).json({
          success: false,
          error: 'API key is required',
          code: 'MISSING_API_KEY'
        });
        return;
      }
      
      const authConfig: AuthConfig = {
        method: AuthMethod.API_KEY,
        config: {
          apiKey,
          permissions
        } as APIKeyConfig
      };
      
      const result = await this.authService.authenticate(authConfig, req.headers['x-correlation-id'] as string);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          sessionId: result.sessionId,
          expiresAt: result.expiresAt,
          permissions: result.permissions,
          user: result.user
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error?.message || 'Authentication failed',
          code: result.error?.code || 'AUTH_FAILED'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * JWT Authentication Endpoint
   * Law of Contextual Coherence: Preserve JWT context
   */
  async authenticateJWT(req: Request, res: Response): Promise<void> {
    try {
      const { token, secret } = req.body;
      
      if (!token) {
        res.status(400).json({
          success: false,
          error: 'JWT token is required',
          code: 'MISSING_JWT_TOKEN'
        });
        return;
      }
      
      const authConfig: AuthConfig = {
        method: AuthMethod.JWT,
        config: {
          token,
          secret
        } as JWTConfig
      };
      
      const result = await this.authService.authenticate(authConfig, req.headers['x-correlation-id'] as string);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          sessionId: result.sessionId,
          token: result.token,
          expiresAt: result.expiresAt,
          permissions: result.permissions,
          user: result.user
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error?.message || 'JWT authentication failed',
          code: result.error?.code || 'JWT_AUTH_FAILED'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * OAuth2 Authentication Endpoint
   * Law of Adaptive Governance: Support multiple OAuth2 providers
   */
  async authenticateOAuth2(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, clientSecret, redirectUri, provider, scope } = req.body;
      
      if (!clientId || !clientSecret || !redirectUri || !provider) {
        res.status(400).json({
          success: false,
          error: 'OAuth2 configuration is incomplete',
          code: 'MISSING_OAUTH2_CONFIG'
        });
        return;
      }
      
      const authConfig: AuthConfig = {
        method: AuthMethod.OAUTH2,
        config: {
          clientId,
          clientSecret,
          redirectUri,
          provider,
          scope
        } as OAuth2Config
      };
      
      const result = await this.authService.authenticate(authConfig, req.headers['x-correlation-id'] as string);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          authorizationUrl: result.token, // OAuth2 returns auth URL as token
          permissions: result.permissions
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error?.message || 'OAuth2 authentication failed',
          code: result.error?.code || 'OAUTH2_AUTH_FAILED'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * Triple Authentication Endpoint (Enterprise-Grade)
   * Law of Procedural Integrity: Sequential triple authentication
   */
  async authenticateTriple(req: Request, res: Response): Promise<void> {
    try {
      const { apiKey, jwtToken, oauth2Token } = req.body;
      
      if (!apiKey || !jwtToken || !oauth2Token) {
        res.status(400).json({
          success: false,
          error: 'Triple authentication requires API key, JWT token, and OAuth2 token',
          code: 'MISSING_TRIPLE_AUTH_TOKENS'
        });
        return;
      }
      
      const result = await this.authService.authenticateTriple(
        apiKey,
        jwtToken,
        oauth2Token,
        req.headers['x-correlation-id'] as string
      );
      
      if (result.success) {
        res.status(200).json({
          success: true,
          sessionId: result.sessionId,
          token: result.token,
          expiresAt: result.expiresAt,
          permissions: result.permissions,
          user: result.user,
          scopes: result.scopes,
          securityLevel: result.securityLevel,
          authSteps: result.authSteps,
          totalDuration: result.totalDuration
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error?.message || 'Triple authentication failed',
          code: result.error?.code || 'TRIPLE_AUTH_FAILED',
          authSteps: result.authSteps,
          totalDuration: result.totalDuration
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * Session Validation Endpoint
   * Law of Contextual Coherence: Maintain session context
   */
  async validateSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        });
        return;
      }
      
      const result = await this.authService.validateSession(sessionId, req.headers['x-correlation-id'] as string);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          sessionId: result.sessionId,
          expiresAt: result.expiresAt,
          permissions: result.permissions,
          user: result.user
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error?.message || 'Session validation failed',
          code: result.error?.code || 'SESSION_INVALID'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * Session Refresh Endpoint
   * Law of Adaptive Governance: Adaptive session management
   */
  async refreshSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        });
        return;
      }
      
      const result = await this.authService.refreshSession(sessionId, req.headers['x-correlation-id'] as string);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          sessionId: result.sessionId,
          token: result.token,
          expiresAt: result.expiresAt,
          permissions: result.permissions,
          user: result.user
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error?.message || 'Session refresh failed',
          code: result.error?.code || 'SESSION_REFRESH_FAILED'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * Session Destruction Endpoint
   * Law of Procedural Integrity: Clean session termination
   */
  async destroySession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        });
        return;
      }
      
      const result = await this.authService.destroySession(sessionId, req.headers['x-correlation-id'] as string);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Session destroyed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error?.message || 'Session destruction failed',
          code: result.error?.code || 'SESSION_DESTROY_FAILED'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * Token Validation Endpoint
   * Law of Recursive Validation: Token validation
   */
  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token is required',
          code: 'MISSING_TOKEN'
        });
        return;
      }
      
      // For now, we'll do basic JWT validation
      // In production, this would be more comprehensive
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(atob(parts[1]));
        const isExpired = payload.exp && payload.exp < Math.floor(Date.now() / 1000);
        
        if (isExpired) {
          res.status(401).json({
            success: false,
            error: 'Token has expired',
            code: 'TOKEN_EXPIRED'
          });
          return;
        }
        
        res.status(200).json({
          success: true,
          valid: true,
          payload: {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            permissions: payload.permissions,
            exp: payload.exp,
            iat: payload.iat
          }
        });
      } catch (error: any) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * Token Refresh Endpoint
   * Law of Adaptive Governance: Token lifecycle management
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        });
        return;
      }
      
      // For now, we'll return a placeholder response
      // In production, this would validate the refresh token and issue a new access token
      res.status(501).json({
        success: false,
        error: 'Token refresh not yet implemented',
        code: 'NOT_IMPLEMENTED'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * OAuth2 Callback Handler
   * Law of Procedural Integrity: Structured OAuth2 flow completion
   */
  async handleOAuth2Callback(req: Request, res: Response): Promise<void> {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;
      
      if (!code || !state) {
        res.status(400).json({
          success: false,
          error: 'OAuth2 callback requires code and state parameters',
          code: 'MISSING_OAUTH2_PARAMS'
        });
        return;
      }
      
      const result = await this.authService.handleOAuth2Callback(
        provider,
        code as string,
        state as string,
        req.headers['x-correlation-id'] as string
      );
      
      if (result.success) {
        res.status(200).json({
          success: true,
          sessionId: result.sessionId,
          token: result.token,
          expiresAt: result.expiresAt,
          permissions: result.permissions,
          user: result.user
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error?.message || 'OAuth2 callback failed',
          code: result.error?.code || 'OAUTH2_CALLBACK_FAILED'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * List Sessions (Admin Endpoint)
   * Law of Recursive Validation: Administrative oversight
   */
  async listSessions(req: Request, res: Response): Promise<void> {
    try {
      // This would require admin authentication in production
      res.status(501).json({
        success: false,
        error: 'Session listing not yet implemented',
        code: 'NOT_IMPLEMENTED'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  /**
   * Get Metrics (Admin Endpoint)
   * Law of Recursive Validation: System health monitoring
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      // This would require admin authentication in production
      res.status(501).json({
        success: false,
        error: 'Metrics endpoint not yet implemented',
        code: 'NOT_IMPLEMENTED'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

