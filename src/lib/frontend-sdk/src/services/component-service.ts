/**
 * Component Service for Frontend SDK
 * 
 * Provides UI component creation and management capabilities
 * for frontend applications connecting to backend APIs.
 */

import axios, { AxiosInstance } from 'axios';
import { ClientResponse, ClientError } from '../types/client-types';
import { Logger } from '../utils/logger';

/**
 * Component configuration
 */
export interface ComponentConfig {
  type: 'chat' | 'form' | 'button' | 'chart' | 'table' | 'custom';
  props: Record<string, any>;
  style?: Record<string, any>;
  events?: Record<string, string>;
}

/**
 * Component instance
 */
export interface ComponentInstance {
  id: string;
  type: string;
  html: string;
  css: string;
  javascript: string;
  props: Record<string, any>;
  metadata: {
    created: number;
    updated: number;
    version: string;
  };
}

/**
 * Service configuration
 */
export interface ComponentServiceConfig {
  serviceUrl: string;
  client: any;
  logger: Logger;
}

/**
 * Component Service
 * Handles UI component creation and management for frontend applications
 */
export class ComponentService {
  private config: ComponentServiceConfig;
  private logger: Logger;
  private httpClient: AxiosInstance;
  private isConnected: boolean = false;

  constructor(config: ComponentServiceConfig) {
    this.config = config;
    this.logger = config.logger;
    
    // Initialize HTTP client for API calls
    this.httpClient = axios.create({
      baseURL: config.serviceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Connect to component service
   */
  public async connect(): Promise<ClientResponse<void>> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Connecting to component service');
      
      // Test connection with health check
      const response = await this.httpClient.get('/health');
      
      if (response.status === 200) {
        this.isConnected = true;
        const responseTime = Date.now() - startTime;
        
        this.logger.info('Successfully connected to component service');
        
        return {
          success: true,
          timestamp: Date.now(),
          responseTime
        };
      } else {
        throw new Error(`Component service health check failed: ${response.status}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const clientError: ClientError = {
        code: 'COMPONENT_CONNECTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown connection error',
        correlationId: 'component-connect',
        timestamp: Date.now(),
        recoverable: true
      };
      
      this.logger.error('Failed to connect to component service', { error: clientError });
      
      return {
        success: false,
        error: clientError,
        timestamp: Date.now(),
        responseTime
      };
    }
  }

  /**
   * Disconnect from component service
   */
  public async disconnect(): Promise<void> {
    this.isConnected = false;
    this.logger.info('Disconnected from component service');
  }

  /**
   * Create a new UI component
   */
  public async createComponent(config: ComponentConfig): Promise<ClientResponse<ComponentInstance>> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Creating UI component', { type: config.type });
      
      const response = await this.httpClient.post('/components', {
        type: config.type,
        props: config.props,
        style: config.style,
        events: config.events
      });
      
      if (response.status === 200 && response.data.success) {
        const responseTime = Date.now() - startTime;
        
        this.logger.info('Component created successfully', { 
          componentId: response.data.component.id,
          type: config.type 
        });
        
        return {
          success: true,
          data: response.data.component,
          timestamp: Date.now(),
          responseTime
        };
      } else {
        throw new Error('Component creation failed');
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const clientError: ClientError = {
        code: 'COMPONENT_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Component creation failed',
        correlationId: 'component-create',
        timestamp: Date.now(),
        recoverable: true
      };
      
      this.logger.error('Component creation failed', { error: clientError });
      
      return {
        success: false,
        error: clientError,
        timestamp: Date.now(),
        responseTime
      };
    }
  }

  /**
   * Update an existing component
   */
  public async updateComponent(componentId: string, updates: Partial<ComponentConfig>): Promise<ClientResponse<ComponentInstance>> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Updating component', { componentId });
      
      const response = await this.httpClient.put(`/components/${componentId}`, updates);
      
      if (response.status === 200 && response.data.success) {
        const responseTime = Date.now() - startTime;
        
        this.logger.info('Component updated successfully', { componentId });
        
        return {
          success: true,
          data: response.data.component,
          timestamp: Date.now(),
          responseTime
        };
      } else {
        throw new Error('Component update failed');
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const clientError: ClientError = {
        code: 'COMPONENT_UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Component update failed',
        correlationId: 'component-update',
        timestamp: Date.now(),
        recoverable: true
      };
      
      return {
        success: false,
        error: clientError,
        timestamp: Date.now(),
        responseTime
      };
    }
  }

  /**
   * Get component by ID
   */
  public async getComponent(componentId: string): Promise<ClientResponse<ComponentInstance>> {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient.get(`/components/${componentId}`);
      
      if (response.status === 200 && response.data.success) {
        const responseTime = Date.now() - startTime;
        
        return {
          success: true,
          data: response.data.component,
          timestamp: Date.now(),
          responseTime
        };
      } else {
        throw new Error('Component not found');
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const clientError: ClientError = {
        code: 'COMPONENT_NOT_FOUND',
        message: error instanceof Error ? error.message : 'Component not found',
        correlationId: 'component-get',
        timestamp: Date.now(),
        recoverable: false
      };
      
      return {
        success: false,
        error: clientError,
        timestamp: Date.now(),
        responseTime
      };
    }
  }

  /**
   * Delete a component
   */
  public async deleteComponent(componentId: string): Promise<ClientResponse<void>> {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient.delete(`/components/${componentId}`);
      
      if (response.status === 200) {
        const responseTime = Date.now() - startTime;
        
        this.logger.info('Component deleted successfully', { componentId });
        
        return {
          success: true,
          timestamp: Date.now(),
          responseTime
        };
      } else {
        throw new Error('Component deletion failed');
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const clientError: ClientError = {
        code: 'COMPONENT_DELETION_FAILED',
        message: error instanceof Error ? error.message : 'Component deletion failed',
        correlationId: 'component-delete',
        timestamp: Date.now(),
        recoverable: true
      };
      
      return {
        success: false,
        error: clientError,
        timestamp: Date.now(),
        responseTime
      };
    }
  }

  /**
   * List all components
   */
  public async listComponents(): Promise<ClientResponse<ComponentInstance[]>> {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient.get('/components');
      
      if (response.status === 200 && response.data.success) {
        const responseTime = Date.now() - startTime;
        
        return {
          success: true,
          data: response.data.components,
          timestamp: Date.now(),
          responseTime
        };
      } else {
        throw new Error('Failed to list components');
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const clientError: ClientError = {
        code: 'COMPONENT_LIST_FAILED',
        message: error instanceof Error ? error.message : 'Failed to list components',
        correlationId: 'component-list',
        timestamp: Date.now(),
        recoverable: true
      };
      
      return {
        success: false,
        error: clientError,
        timestamp: Date.now(),
        responseTime
      };
    }
  }

  /**
   * Render component to HTML
   */
  public async renderComponent(componentId: string): Promise<ClientResponse<string>> {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient.post(`/components/${componentId}/render`);
      
      if (response.status === 200 && response.data.success) {
        const responseTime = Date.now() - startTime;
        
        return {
          success: true,
          data: response.data.html,
          timestamp: Date.now(),
          responseTime
        };
      } else {
        throw new Error('Component rendering failed');
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const clientError: ClientError = {
        code: 'COMPONENT_RENDER_FAILED',
        message: error instanceof Error ? error.message : 'Component rendering failed',
        correlationId: 'component-render',
        timestamp: Date.now(),
        recoverable: true
      };
      
      return {
        success: false,
        error: clientError,
        timestamp: Date.now(),
        responseTime
      };
    }
  }

  /**
   * Get connection status
   */
  public isServiceConnected(): boolean {
    return this.isConnected;
  }
}

