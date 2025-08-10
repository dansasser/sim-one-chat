/**
 * Local Authentication Types for AgentUI Auth Service
 * 
 * These types are defined locally to avoid circular dependencies
 * and ensure the auth service can build independently.
 */

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AuthRequest {
  method: 'api_key' | 'jwt' | 'oauth2';
  credentials: {
    apiKey?: string;
    token?: string;
    code?: string;
    state?: string;
  };
  config?: {
    token?: string;
    apiKey?: string;
    permissions?: string[];
    provider?: string;
  };
  correlationId?: string;
}

export interface AuthServiceConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  argon2: Argon2Config;
  sessionTimeout: number;
  enableLogging: boolean;
}

export interface Argon2Config {
  memoryCost: number;
  timeCost: number;
  parallelism: number;
  hashLength: number;
}

export interface AuthConfig {
  method: AuthMethod;
  config: APIKeyConfig | JWTConfig | OAuth2Config;
}

export enum AuthMethod {
  API_KEY = 'api-key',
  JWT = 'jwt',
  OAUTH2 = 'oauth2'
}

export interface APIKeyConfig {
  apiKey: string;
  permissions?: string[];
}

export interface JWTConfig {
  token: string;
  secret?: string;
  expiresIn?: string;
  algorithm?: string;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  provider: string;
  scope?: string[];
  state?: string;
}

// ============================================================================
// AUTHENTICATION RESULTS
// ============================================================================

export interface TripleAuthResult {
  success: boolean;
  sessionId?: string;
  token?: string;
  expiresAt?: number;
  permissions?: string[];
  user?: any;
  scopes?: string[];
  authSteps?: AuthStep[];
  totalDuration?: number;
  correlationId?: string;
  securityLevel?: string;
  error?: AgentUIError;
}

export interface AuthStep {
  step: number;
  method: string;
  duration: number;
  success: boolean;
  permissions?: string[];
  user?: any;
  scopes?: string[];
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface AgentUIError {
  code: string;
  message: string;
  timestamp: string;
  correlationId?: string;
  details?: any;
}

export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_EXPIRED_TOKEN = 'AUTH_EXPIRED_TOKEN',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_INVALID_API_KEY = 'AUTH_INVALID_API_KEY',
  AUTH_INVALID_JWT = 'AUTH_INVALID_JWT',
  AUTH_OAUTH2_ERROR = 'AUTH_OAUTH2_ERROR',
  AUTH_FAILED = 'AUTH_FAILED',
  
  // Session errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export class AgentUIErrorFactory {
  static create(code: ErrorCode, message: string, details?: any): AgentUIError {
    return {
      code,
      message,
      timestamp: new Date().toISOString(),
      correlationId: generateCorrelationId(),
      details
    };
  }
  
  static authError(message: string, details?: any): AgentUIError {
    return this.create(ErrorCode.AUTH_INVALID_CREDENTIALS, message, details);
  }
  
  static createAuthError(code: ErrorCode, message: string, details?: any): AgentUIError {
    return this.create(code, message, details);
  }
  
  static sessionError(message: string, details?: any): AgentUIError {
    return this.create(ErrorCode.SESSION_NOT_FOUND, message, details);
  }
  
  static validationError(message: string, details?: any): AgentUIError {
    return this.create(ErrorCode.VALIDATION_FAILED, message, details);
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export function validateAuth(auth: AuthConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Validate method
  if (!auth.method || !Object.values(AuthMethod).includes(auth.method)) {
    errors.push({
      field: 'method',
      message: 'Invalid authentication method',
      code: 'INVALID_AUTH_METHOD'
    });
  }
  
  // Validate config based on method
  switch (auth.method) {
    case AuthMethod.API_KEY:
      const apiKeyConfig = auth.config as APIKeyConfig;
      if (!apiKeyConfig.apiKey) {
        errors.push({
          field: 'config.apiKey',
          message: 'API key is required',
          code: 'MISSING_API_KEY'
        });
      } else if (apiKeyConfig.apiKey.length < 32) {
        warnings.push({
          field: 'config.apiKey',
          message: 'API key should be at least 32 characters for security',
          suggestion: 'Use a longer, more secure API key'
        });
      }
      break;
      
    case AuthMethod.JWT:
      const jwtConfig = auth.config as JWTConfig;
      if (!jwtConfig.token) {
        errors.push({
          field: 'config.token',
          message: 'JWT token is required',
          code: 'MISSING_JWT_TOKEN'
        });
      }
      break;
      
    case AuthMethod.OAUTH2:
      const oauth2Config = auth.config as OAuth2Config;
      if (!oauth2Config.clientId) {
        errors.push({
          field: 'config.clientId',
          message: 'OAuth2 client ID is required',
          code: 'MISSING_OAUTH2_CLIENT_ID'
        });
      }
      if (!oauth2Config.clientSecret) {
        errors.push({
          field: 'config.clientSecret',
          message: 'OAuth2 client secret is required',
          code: 'MISSING_OAUTH2_CLIENT_SECRET'
        });
      }
      if (!oauth2Config.redirectUri) {
        errors.push({
          field: 'config.redirectUri',
          message: 'OAuth2 redirect URI is required',
          code: 'MISSING_OAUTH2_REDIRECT_URI'
        });
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

export function generateCorrelationId(): string {
  return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateApiKey(): string {
  const prefix = 'agentui_';
  const randomPart = Array.from({ length: 32 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('');
  return prefix + randomPart;
}

