/**
 * Client Types for SIM-ONE Framework Integration
 * 
 * Defines common types used across the frontend SDK for type safety
 * and consistent API responses.
 */

export interface ClientResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  requestId?: string;
}

export interface ClientError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  requestId?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ClientError;
  metadata?: {
    processingTime?: number;
    requestId?: string;
    version?: string;
  };
}

export interface ProcessingStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  currentStage?: string;
  estimatedCompletion?: number;
}

export interface UniversalProcessRequest {
  input: string;
  style?: string;
  priority?: 'fast' | 'balanced' | 'quality';
  protocols?: string[];
  metadata?: Record<string, any>;
}

export interface UniversalProcessResponse {
  jobId: string;
  status: ProcessingStatus;
  result?: {
    content: string;
    metadata: {
      processingTime: number;
      qualityScore?: number;
      style: string;
      protocolsApplied: string[];
    };
  };
}

