/**
 * Core AgentUI Frontend SDK with SIM-ONE Framework Integration
 * 
 * This client provides a unified interface for frontend applications to connect
 * to backend APIs with comprehensive validation, authentication, component management,
 * and universal AI processing through the SIM-ONE Framework.
 * 
 * Features:
 * - Framework-agnostic design (works with React, Vue, Astro, vanilla JS)
 * - Multiple authentication methods (API Key, JWT, OAuth2)
 * - Component creation and management
 * - Universal AI processing through SIM-ONE five-agent pipeline
 * - Real-time event handling and status tracking
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';

// Local type definitions to avoid import issues
interface AgentUIMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

interface MessageType {
  REQUEST: string;
  RESPONSE: string;
  EVENT: string;
}

import {
  ClientConfig,
  ClientOptions,
  ClientState,
  ClientError,
  ClientResponse,
  ClientEvent,
  ClientEventType,
  RequestOptions
} from '../types/client-types';

import { AuthService } from '../services/auth-service';
import { ComponentService } from '../services/component-service';
import { SIMONEService, ProcessingOptions, SIMONEJobResult } from '../services/simone-service';
import { Logger } from '../utils/logger';

/**
 * Main AgentUI Frontend SDK Client with SIM-ONE Integration
 * Provides comprehensive frontend integration with backend APIs and universal AI processing
 */
export class AgentUIClient extends EventEmitter {
  private config: ClientConfig;
  private state: ClientState;
  private logger: Logger;
  
  // Service instances
  private authService: AuthService;
  private componentService: ComponentService;
  private simoneService: SIMONEService;

  constructor(options: ClientOptions) {
    super();
    
    this.config = this.initializeConfig(options.config);
    this.state = this.initializeState();
    this.logger = new Logger({ 
      enabled: this.config.development?.enableLogging || false,
      level: 'info'
    });
    
    // Initialize services
    this.authService = new AuthService({ 
      serviceUrl: this.config.authServiceUrl,
      client: null,
      logger: this.logger
    });
    this.componentService = new ComponentService({ 
      serviceUrl: this.config.componentServiceUrl,
      client: null,
      logger: this.logger
    });
    this.simoneService = new SIMONEService(this.config.simone);
    
    // Set up event handlers
    this.setupEventHandlers(options);
    
    this.logger.info('AgentUI Client initialized with SIM-ONE Framework integration', {
      authServiceUrl: this.config.authServiceUrl,
      componentServiceUrl: this.config.componentServiceUrl,
      simoneBaseURL: this.config.simone.baseURL,
      validation: this.config.validation
    });
  }

  /**
   * Initialize client configuration with defaults
   */
  private initializeConfig(config: Partial<ClientConfig>): ClientConfig {
    return {
      authServiceUrl: config.authServiceUrl || 'http://localhost:3001',
      componentServiceUrl: config.componentServiceUrl || 'http://localhost:3002',
      simone: {
        baseURL: 'http://localhost:5000',
        timeout: 30000,
        retryAttempts: 3,
        ...config.simone
      },
      auth: {
        apiKey: '',
        ...config.auth
      },
      validation: {
        enabled: true,
        enableAuditTrail: true,
        enableErrorRecovery: true,
        ...config.validation
      },
      performance: {
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableCaching: true,
        cacheTimeout: 300000,
        ...config.performance
      },
      development: {
        enableLogging: false,
        logLevel: 'info',
        enableMetrics: false,
        ...config.development
      }
    };
  }

  /**
   * Initialize client state
   */
  private initializeState(): ClientState {
    return {
      connected: false,
      authenticated: false,
      sessionId: uuidv4(),
      correlationId: uuidv4(),
      lastActivity: Date.now(),
      validationEnabled: this.config.validation?.enabled || true,
      validationLevel: 'moderate',
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Set up event handlers from options
   */
  private setupEventHandlers(options: ClientOptions): void {
    if (options.onConnect) this.on('connect', options.onConnect);
    if (options.onDisconnect) this.on('disconnect', options.onDisconnect);
    if (options.onError) this.on('error', options.onError);
    if (options.onMessage) this.on('message', options.onMessage);
    if (options.onValidationError) this.on('validation-error', options.onValidationError);
    if (options.onGovernanceViolation) this.on('governance-violation', options.onGovernanceViolation);
    if (options.onAuditEvent) this.on('audit-event', options.onAuditEvent);
  }

  /**
   * Connect to all services
   */
  async connect(): Promise<ClientResponse<boolean>> {
    try {
      this.logger.info('Connecting to AgentUI services...');
      
      // Test SIM-ONE connection
      const simoneTest = await this.simoneService.testConnection();
      if (!simoneTest.success) {
        throw new Error(`SIM-ONE connection failed: ${simoneTest.error?.message}`);
      }
      
      this.state.connected = true;
      this.state.lastActivity = Date.now();
      
      this.emit('connect');
      this.logger.info('Successfully connected to all AgentUI services');
      
      return {
        success: true,
        data: true,
        correlationId: this.state.correlationId,
        timestamp: Date.now()
      };
      
    } catch (error) {
      const clientError: ClientError = {
        code: 'CONNECTION_FAILED',
        message: error instanceof Error ? error.message : 'Connection failed',
        correlationId: this.state.correlationId,
        timestamp: Date.now(),
        recoverable: true
      };
      
      this.emit('error', clientError);
      
      return {
        success: false,
        error: clientError,
        correlationId: this.state.correlationId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Disconnect from all services
   */
  async disconnect(): Promise<void> {
    this.state.connected = false;
    this.emit('disconnect');
    this.logger.info('Disconnected from AgentUI services');
  }

  /**
   * Universal chat interface using SIM-ONE Framework
   * Every message goes through the complete five-agent pipeline
   */
  async chat(
    message: string,
    options: {
      context?: string;
      style?: string;
      priority?: 'fast' | 'balanced' | 'quality';
    } = {}
  ): Promise<ClientResponse<SIMONEJobResult>> {
    this.logger.info('Processing chat message through SIM-ONE Framework', { message, options });
    
    const startTime = Date.now();
    this.state.requestCount++;
    
    try {
      const result = await this.simoneService.chat(message, options.context);
      
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(responseTime);
      
      this.emit('ai-response', {
        type: 'ai-response',
        data: result.data,
        timestamp: Date.now(),
        correlationId: this.state.correlationId
      });
      
      return result;
      
    } catch (error) {
      this.state.errorCount++;
      const clientError: ClientError = {
        code: 'CHAT_FAILED',
        message: error instanceof Error ? error.message : 'Chat processing failed',
        correlationId: this.state.correlationId,
        timestamp: Date.now(),
        recoverable: true
      };
      
      this.emit('error', clientError);
      
      return {
        success: false,
        error: clientError,
        correlationId: this.state.correlationId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Process any input through SIM-ONE universal pipeline
   */
  async processUniversal(
    input: string,
    options: ProcessingOptions = {}
  ): Promise<ClientResponse<SIMONEJobResult>> {
    this.logger.info('Processing input through SIM-ONE universal pipeline', { input, options });
    
    const startTime = Date.now();
    this.state.requestCount++;
    
    try {
      const result = await this.simoneService.processAndWait(input, options);
      
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(responseTime);
      
      this.emit('ai-response', {
        type: 'ai-response',
        data: result.data,
        timestamp: Date.now(),
        correlationId: this.state.correlationId
      });
      
      return result;
      
    } catch (error) {
      this.state.errorCount++;
      const clientError: ClientError = {
        code: 'PROCESSING_FAILED',
        message: error instanceof Error ? error.message : 'Universal processing failed',
        correlationId: this.state.correlationId,
        timestamp: Date.now(),
        recoverable: true
      };
      
      this.emit('error', clientError);
      
      return {
        success: false,
        error: clientError,
        correlationId: this.state.correlationId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Generate content with specific style through SIM-ONE
   */
  async generateContent(
    prompt: string,
    style: string,
    options: ProcessingOptions = {}
  ): Promise<ClientResponse<SIMONEJobResult>> {
    return this.processUniversal(prompt, { ...options, style });
  }

  /**
   * Create a component using the component service
   */
  async createComponent(config: any): Promise<ClientResponse<any>> {
    this.logger.info('Creating component', { config });
    
    try {
      const result = await this.componentService.createComponent(config);
      
      this.emit('component-created', {
        type: 'component-created',
        data: result.data,
        timestamp: Date.now(),
        correlationId: this.state.correlationId
      });
      
      return result;
      
    } catch (error) {
      const clientError: ClientError = {
        code: 'COMPONENT_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Component creation failed',
        correlationId: this.state.correlationId,
        timestamp: Date.now(),
        recoverable: true
      };
      
      this.emit('error', clientError);
      
      return {
        success: false,
        error: clientError,
        correlationId: this.state.correlationId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Authenticate with the auth service
   */
  async authenticate(credentials: any): Promise<ClientResponse<any>> {
    this.logger.info('Authenticating user');
    
    try {
      const result = await this.authService.authenticate(credentials);
      
      if (result.success) {
        this.state.authenticated = true;
        this.emit('authenticate', {
          type: 'authenticate',
          data: result.data,
          timestamp: Date.now(),
          correlationId: this.state.correlationId
        });
      }
      
      return result;
      
    } catch (error) {
      const clientError: ClientError = {
        code: 'AUTHENTICATION_FAILED',
        message: error instanceof Error ? error.message : 'Authentication failed',
        correlationId: this.state.correlationId,
        timestamp: Date.now(),
        recoverable: true
      };
      
      this.emit('error', clientError);
      
      return {
        success: false,
        error: clientError,
        correlationId: this.state.correlationId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get SIM-ONE system information
   */
  async getSIMONEInfo(): Promise<ClientResponse<any>> {
    return this.simoneService.testConnection();
  }

  /**
   * Get available processing styles from SIM-ONE
   */
  async getProcessingStyles(): Promise<ClientResponse<any>> {
    try {
      // For now, return a basic response since we need to implement the styles endpoint
      return {
        success: true,
        data: {
          universal_chat: {
            name: 'Universal Chat',
            description: 'Optimized for conversational interactions',
            category: 'chat'
          },
          analytical_article: {
            name: 'Analytical Article',
            description: 'Deep analysis and structured thinking',
            category: 'analysis'
          },
          creative_writing: {
            name: 'Creative Writing',
            description: 'Imaginative and expressive content',
            category: 'creative'
          }
        },
        correlationId: this.state.correlationId,
        timestamp: Date.now()
      };
    } catch (error) {
      const clientError: ClientError = {
        code: 'STYLES_FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch processing styles',
        correlationId: this.state.correlationId,
        timestamp: Date.now(),
        recoverable: true
      };
      
      return {
        success: false,
        error: clientError,
        correlationId: this.state.correlationId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(responseTime: number): void {
    const totalTime = this.state.averageResponseTime * (this.state.requestCount - 1) + responseTime;
    this.state.averageResponseTime = totalTime / this.state.requestCount;
    this.state.lastActivity = Date.now();
  }

  /**
   * Get current client state
   */
  getState(): ClientState {
    return { ...this.state };
  }

  /**
   * Get current configuration (excluding sensitive data)
   */
  getConfig(): Omit<ClientConfig, 'auth'> {
    const { auth, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Update client configuration
   */
  updateConfig(newConfig: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update service configurations
    if (newConfig.simone) {
      this.simoneService.updateConfig(newConfig.simone);
    }
    
    this.logger.info('Client configuration updated');
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    requestCount: number;
    errorCount: number;
    successRate: number;
    averageResponseTime: number;
    uptime: number;
  } {
    const successRate = this.state.requestCount > 0 
      ? ((this.state.requestCount - this.state.errorCount) / this.state.requestCount) * 100 
      : 0;
    
    return {
      requestCount: this.state.requestCount,
      errorCount: this.state.errorCount,
      successRate,
      averageResponseTime: this.state.averageResponseTime,
      uptime: Date.now() - (this.state.lastActivity - this.state.averageResponseTime)
    };
  }
}

