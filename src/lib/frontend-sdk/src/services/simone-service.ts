/**
 * SIM-ONE Framework Integration Service
 * 
 * Connects AgentUI SDK to SIM-ONE Framework backend for universal AI processing.
 * All interactions go through the complete five-agent cognitive governance pipeline:
 * Ideator → Drafter → Reviser → Critic → Summarizer
 */

import { ClientResponse, ClientError } from '../types/client-types';

export interface SIMONEConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface ProcessingOptions {
  style?: string;
  priority?: 'fast' | 'balanced' | 'quality';
  protocols?: Record<string, any>;
  context?: string;
}

export interface SIMONEJobResponse {
  job_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  input: string;
  style: string;
  workflow: string;
  message: string;
  estimated_time: string;
  priority: string;
  protocols?: string[];
  context?: string;
}

export interface SIMONEJobStatus {
  job_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  current_stage?: {
    current_step: string;
    progress: number;
    research_completed?: boolean;
  };
  ideator_output?: string;
  drafter_output?: string;
  reviser_output?: string;
  critic_output?: string;
  final_output?: string;
  error_message?: string;
  created_at: number;
  updated_at: number;
  style: string;
  protocol_configs: Record<string, any>;
}

export interface SIMONEJobResult {
  job_id: string;
  status: string;
  final_output: string;
  workflow_outputs: {
    ideator: string;
    drafter: string;
    reviser: string;
    critic: string;
    summarizer: string;
  };
  metadata: {
    style: string;
    processing_time: number;
    word_count: number;
    protocols_applied: string[];
  };
  quality_metrics: {
    overall_score: number;
    clarity_score: number;
    coherence_score: number;
    style_compliance: number;
  };
}

export class SIMONEService {
  private config: SIMONEConfig;
  private correlationId: string;

  constructor(config: SIMONEConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };
    this.correlationId = this.generateCorrelationId();
  }

  private generateCorrelationId(): string {
    return `simone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ClientResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-correlation-id': this.correlationId,
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ClientError = {
          code: response.status.toString(),
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          correlationId: this.correlationId,
          timestamp: Date.now(),
          details: errorData,
          recoverable: response.status >= 500 || response.status === 429
        };
        
        return {
          success: false,
          error,
          correlationId: this.correlationId,
          timestamp: Date.now()
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        correlationId: this.correlationId,
        timestamp: Date.now()
      };

    } catch (error) {
      const clientError: ClientError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
        correlationId: this.correlationId,
        timestamp: Date.now(),
        details: { originalError: error },
        recoverable: true
      };

      return {
        success: false,
        error: clientError,
        correlationId: this.correlationId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Process any input through the complete SIM-ONE multi-agent pipeline
   */
  async processUniversal(
    input: string,
    options: ProcessingOptions = {}
  ): Promise<ClientResponse<SIMONEJobResponse>> {
    const requestData = {
      topic: input,  // SIM-ONE Framework expects 'topic' not 'input'
      style: options.style || 'conversational',
      priority: options.priority || 'balanced',
      protocol_configs: options.protocols || {},
      context: options.context || ''
    };

    return this.makeRequest<SIMONEJobResponse>('/api/start_writing', {  // Use correct endpoint
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  }

  /**
   * Get the status of a processing job
   */
  async getJobStatus(jobId: string): Promise<ClientResponse<SIMONEJobStatus>> {
    return this.makeRequest<SIMONEJobStatus>(`/api/job_status/${jobId}`);  // Use correct endpoint
  }

  /**
   * Get the final result of a completed job
   */
  async getJobResult(jobId: string): Promise<ClientResponse<SIMONEJobResult>> {
    return this.makeRequest<SIMONEJobResult>(`/api/job_result/${jobId}`);  // Use correct endpoint
  }

  /**
   * Wait for a job to complete and return the result
   */
  async waitForCompletion(
    jobId: string,
    pollInterval: number = 1000,
    maxWaitTime: number = 60000
  ): Promise<ClientResponse<SIMONEJobResult>> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await this.getJobStatus(jobId);
      
      if (!statusResponse.success) {
        return {
          success: false,
          error: statusResponse.error,
          correlationId: this.correlationId,
          timestamp: Date.now()
        };
      }

      const status = statusResponse.data!.status;
      
      if (status === 'completed') {
        return this.getJobResult(jobId);
      }
      
      if (status === 'failed') {
        const error: ClientError = {
          code: 'PROCESSING_FAILED',
          message: statusResponse.data!.error_message || 'Job processing failed',
          correlationId: this.correlationId,
          timestamp: Date.now(),
          details: statusResponse.data,
          recoverable: false
        };
        
        return {
          success: false,
          error,
          correlationId: this.correlationId,
          timestamp: Date.now()
        };
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout reached
    const error: ClientError = {
      code: 'TIMEOUT',
      message: `Job did not complete within ${maxWaitTime}ms`,
      correlationId: this.correlationId,
      timestamp: Date.now(),
      details: { jobId, maxWaitTime },
      recoverable: true
    };

    return {
      success: false,
      error,
      correlationId: this.correlationId,
      timestamp: Date.now()
    };
  }

  /**
   * Process input and wait for the complete result
   */
  async processAndWait(
    input: string,
    options: ProcessingOptions = {}
  ): Promise<ClientResponse<SIMONEJobResult>> {
    // Start processing
    const jobResponse = await this.processUniversal(input, options);
    
    if (!jobResponse.success) {
      return {
        success: false,
        error: jobResponse.error,
        correlationId: this.correlationId,
        timestamp: Date.now()
      };
    }

    // Wait for completion
    return this.waitForCompletion(jobResponse.data!.job_id);
  }

  /**
   * Chat interface - processes messages through SIM-ONE pipeline
   */
  async chat(
    message: string,
    context?: string
  ): Promise<ClientResponse<SIMONEJobResult>> {
    return this.processAndWait(message, {
      style: 'universal_chat',
      priority: 'balanced',
      context
    });
  }

  /**
   * Test the connection to SIM-ONE Framework
   */
  async testConnection(): Promise<ClientResponse<any>> {
    return this.makeRequest<any>('/api/info');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SIMONEConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.correlationId = this.generateCorrelationId();
  }
}

