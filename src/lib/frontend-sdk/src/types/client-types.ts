/**
 * Client SDK type definitions for frontend integration.
 * Provides comprehensive types for authentication, validation, and API communication.
 */

// Define UserContext locally to avoid import issues
export interface UserContext {
  userId?: string;
  sessionId?: string;
  preferences?: Record<string, any>;
}

/**
 * Core client configuration
 */
export interface ClientConfig {
  authServiceUrl: string;
  componentServiceUrl: string;
  
  // SIM-ONE Framework configuration
  simone: {
    baseURL: string;
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
  };
  
  // Authentication configuration
  auth: {
    apiKey: string;
    jwt?: string;
    oauth2?: {
      provider: 'google' | 'github' | 'custom';
      clientId: string;
      redirectUri?: string;
      scopes?: string[];
    };
  };
  
  // Validation configuration
  validation?: {
    enabled: boolean;
    enableAuditTrail?: boolean;
    enableErrorRecovery?: boolean;
    validationRules?: string[];
  };
  
  // Performance configuration
  performance: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    enableCaching: boolean;
    cacheTimeout: number;
  };
  
  // Development configuration
  development?: {
    enableLogging?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics?: boolean;
  };
}

/**
 * Client initialization options
 */
export interface ClientOptions {
  config: Partial<ClientConfig>;
  userContext?: UserContext;
  sessionContext?: any;
  
  // Event handlers (Law of Contextual Coherence)
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: ClientError) => void;
  onMessage?: (message: any) => void;
  
  // Governance handlers (Law of Procedural Integrity)
  onValidationError?: (error: ValidationError) => void;
  onGovernanceViolation?: (violation: GovernanceViolation) => void;
  onAuditEvent?: (event: AuditEvent) => void;
}

/**
 * Client connection state
 */
export interface ClientState {
  connected: boolean;
  authenticated: boolean;
  sessionId: string;
  correlationId: string;
  lastActivity: number;
  
  // Validation state
  validationEnabled: boolean;
  validationLevel: 'strict' | 'moderate' | 'lenient';
  
  // Performance state
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
}

/**
 * Client error types
 */
export interface ClientError {
  code: string;
  message: string;
  correlationId: string;
  timestamp: number;
  recoverable?: boolean;
  suggestions?: string[];
  details?: any;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  value: any;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Governance violation details
 */
export interface GovernanceViolation {
  law: string;
  rule: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  action: 'block' | 'warn' | 'log';
  recoveryActions: string[];
}

/**
 * Audit event details
 */
export interface AuditEvent {
  eventType: string;
  action: string;
  resource: string;
  userId?: string;
  sessionId: string;
  correlationId: string;
  timestamp: number;
  metadata: Record<string, any>;
  
  // Governance audit (Law of Procedural Integrity)
  governanceData?: {
    appliedLaws: string[];
    validationResults: any[];
    coordinationEvents: string[];
  };
}

/**
 * Request options for client operations
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  correlationId?: string;
  
  // Governance options (Law of Adaptive Governance)
  governance?: {
    skipValidation?: boolean;
    customRules?: string[];
    validationLevel?: 'strict' | 'moderate' | 'lenient';
  };
  
  // Context options (Law of Contextual Coherence)
  context?: {
    preserveSession?: boolean;
    inheritContext?: boolean;
    customMetadata?: Record<string, any>;
  };
}

/**
 * Response wrapper for client operations
 */
export interface ClientResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ClientError;
  correlationId?: string;
  timestamp: number;
  responseTime?: number;
}

/**
 * Event types for client event system
 */
export type ClientEventType = 
  | 'connect'
  | 'disconnect'
  | 'authenticate'
  | 'error'
  | 'message'
  | 'validation-error'
  | 'governance-violation'
  | 'audit-event'
  | 'component-created'
  | 'component-updated'
  | 'component-deleted'
  | 'ai-request'
  | 'ai-response';

/**
 * Event data structure
 */
export interface ClientEvent<T = any> {
  type: ClientEventType;
  data: T;
  timestamp: number;
  correlationId: string;
  
  // Governance event data (Law of Cognitive Coordination)
  governance?: {
    triggeredBy: string;
    appliedLaws: string[];
    coordinationLevel: number;
  };
}

