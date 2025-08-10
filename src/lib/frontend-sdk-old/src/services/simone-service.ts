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

export interface SIMONEStyleInfo {
  name: string;
  description: string;
  category: string;
  tone: string;
  structure: string;
  vocabulary: string;
  examples: string[];
  universal_use_cases: string[];
}

export class SIMONEService {
  private config: SIMONEConfig;
  private correlationId: string;

  constructor(config: SIMONEConfig) {
    this.config = {
      timeout: 60000,  // Increase timeout to 60 seconds
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
      headers,
      timeout: this.config.timeout
    };

    try {
      console.log(`Making request to: ${url}`);
      const response = await fetch(url, requestOptions);
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Request failed: ${response.status} - ${response.statusText}`, errorData);
        const error: ClientError = {
          code: response.status.toString(),
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData,
          recoverable: response.status >= 500 || response.status === 429
        };
        
        return {
          success: false,
          error,
          correlationId: this.correlationId
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        correlationId: this.correlationId
      };

    } catch (error) {
      console.error(`Network error for ${url}:`, error);
      const clientError: ClientError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
        details: { originalError: error },
        recoverable: true
      };

      return {
        success: false,
        error: clientError,
        correlationId: this.correlationId
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
      input,
      style: options.style || 'auto',
      priority: options.priority || 'balanced',
      protocol_configs: options.protocols || {},
      context: options.context || ''
    };

    return this.makeRequest<SIMONEJobResponse>('/api/universal_process', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  }

  /**
   * Get the status of a processing job
   */
  async getJobStatus(jobId: string): Promise<ClientResponse<SIMONEJobStatus>> {
    return this.makeRequest<SIMONEJobStatus>(`/api/universal_status/${jobId}`);
  }

  /**
   * Get the final result of a completed job
   */
  async getJobResult(jobId: string): Promise<ClientResponse<SIMONEJobResult>> {
    return this.makeRequest<SIMONEJobResult>(`/api/universal_result/${jobId}`);
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
          correlationId: this.correlationId
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
          details: statusResponse.data,
          recoverable: false
        };
        
        return {
          success: false,
          error,
          correlationId: this.correlationId
        };
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout reached
    const error: ClientError = {
      code: 'TIMEOUT',
      message: `Job did not complete within ${maxWaitTime}ms`,
      details: { jobId, maxWaitTime },
      recoverable: true
    };

    return {
      success: false,
      error,
      correlationId: this.correlationId
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
        correlationId: this.correlationId
      };
    }

    // Wait for completion
    return this.waitForCompletion(jobResponse.data!.job_id);
  }

  /**
   * Get all available processing styles
   */
  async getStyles(): Promise<ClientResponse<Record<string, SIMONEStyleInfo>>> {
    return this.makeRequest<Record<string, SIMONEStyleInfo>>('/api/universal_styles');
  }

  /**
   * Get information about the SIM-ONE universal processing system
   */
  async getSystemInfo(): Promise<ClientResponse<any>> {
    return this.makeRequest<any>('/api/universal_info');
  }

  /**
   * Test the connection to SIM-ONE Framework
   */
  async testConnection(): Promise<ClientResponse<any>> {
    return this.makeRequest<any>('/api/universal_info');
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
   * Generate content with specific style
   */
  async generateContent(
    prompt: string,
    style: string,
    options: ProcessingOptions = {}
  ): Promise<ClientResponse<SIMONEJobResult>> {
    return this.processAndWait(prompt, {
      ...options,
      style
    });
  }

  /**
   * Analyze text through SIM-ONE pipeline
   */
  async analyzeText(
    text: string,
    analysisType: string = 'analytical_article'
  ): Promise<ClientResponse<SIMONEJobResult>> {
    const prompt = `Please analyze the following text: ${text}`;
    
    return this.processAndWait(prompt, {
      style: analysisType,
      priority: 'quality'
    });
  }

  /**
   * Get processing statistics and metrics
   */
  async getProcessingStats(jobId: string): Promise<ClientResponse<any>> {
    const result = await this.getJobResult(jobId);
    
    if (!result.success) {
      return result;
    }

    const stats = {
      jobId,
      processingTime: result.data!.metadata.processing_time,
      wordCount: result.data!.metadata.word_count,
      qualityScore: result.data!.quality_metrics.overall_score,
      style: result.data!.metadata.style,
      protocolsApplied: result.data!.metadata.protocols_applied,
      workflowSteps: Object.keys(result.data!.workflow_outputs).length
    };

    return {
      success: true,
      data: stats,
      correlationId: this.correlationId
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SIMONEConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.correlationId = this.generateCorrelationId();
  }

  /**
   * Get current configuration (excluding sensitive data)
   */
  getConfig(): Omit<SIMONEConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }
}

