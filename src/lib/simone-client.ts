/**
 * SIM-ONE Client Integration for Astro Frontend
 * 
 * Provides a simplified interface to the SIM-ONE Framework through the AgentUI SDK.
 * Implements the Five Laws of Cognitive Governance in the frontend.
 */

import { SIMONEService, type SIMONEConfig, type ProcessingOptions } from './frontend-sdk/src/services/simone-service';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  status?: 'sending' | 'processing' | 'completed' | 'error';
  jobId?: string;
  metadata?: {
    processingTime?: number;
    qualityScore?: number;
    style?: string;
    protocolsApplied?: string[];
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  title?: string;
  createdAt: number;
  updatedAt: number;
  isAuthenticated: boolean;
  userId?: string;
}

export interface SIMONEClientConfig {
  // SIM-ONE Framework configuration (Level 1: Framework backend)
  simoneBaseURL?: string;
  simoneApiKey?: string;
  
  // Direct API configuration (Level 2: SDK fallback)
  openaiApiKey?: string;
  openaiBaseURL?: string;
  anthropicApiKey?: string;
  anthropicBaseURL?: string;
  
  // Model switching configuration
  preferredProvider?: 'simone' | 'openai' | 'anthropic';
  enableFallback?: boolean;
  fallbackOrder?: ('simone' | 'openai' | 'anthropic')[];
  
  // Client configuration
  timeout?: number;
  retryAttempts?: number;
}

export class SIMONEClient {
  private simoneService: SIMONEService | null = null;
  private config: SIMONEClientConfig;
  private currentSession: ChatSession | null = null;

  constructor(config: SIMONEClientConfig) {
    this.config = {
      preferredProvider: 'simone',
      enableFallback: true,
      fallbackOrder: ['simone', 'openai', 'anthropic'],
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };

    // Initialize SIM-ONE service if configuration is provided
    if (this.config.simoneBaseURL) {
      this.simoneService = new SIMONEService({
        baseURL: this.config.simoneBaseURL,
        apiKey: this.config.simoneApiKey,
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts
      });
    }
  }

  /**
   * Initialize a new chat session
   */
  initializeSession(isAuthenticated: boolean = false, userId?: string): ChatSession {
    this.currentSession = {
      id: this.generateSessionId(),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isAuthenticated,
      userId
    };

    // Add welcome message
    this.addSystemMessage(
      "Welcome to SIM-ONE! I'm powered by a revolutionary five-agent cognitive governance framework. How can I help you today?"
    );

    return this.currentSession;
  }

  /**
   * Send a message and get AI response with intelligent provider fallback
   */
  async sendMessage(content: string, options: ProcessingOptions = {}): Promise<ChatMessage> {
    if (!this.currentSession) {
      throw new Error('No active chat session. Please initialize a session first.');
    }

    // Add user message
    const userMessage = this.addUserMessage(content);

    // Create assistant message placeholder
    const assistantMessage: ChatMessage = {
      id: this.generateMessageId(),
      content: '',
      role: 'assistant',
      timestamp: Date.now(),
      status: 'processing'
    };

    this.currentSession.messages.push(assistantMessage);
    this.updateSession();

    // Try providers in order based on configuration
    const providers = this.config.enableFallback 
      ? this.config.fallbackOrder || ['simone', 'openai', 'anthropic']
      : [this.config.preferredProvider || 'simone'];

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        let response;
        
        switch (provider) {
          case 'simone':
            if (this.simoneService) {
              response = await this.processWithSIMONE(content, options);
              break;
            }
            continue; // Skip if SIM-ONE not configured
            
          case 'openai':
            if (this.config.openaiApiKey) {
              response = await this.processWithOpenAI(content);
              break;
            }
            continue; // Skip if OpenAI not configured
            
          case 'anthropic':
            if (this.config.anthropicApiKey) {
              response = await this.processWithAnthropic(content);
              break;
            }
            continue; // Skip if Anthropic not configured
            
          default:
            continue;
        }

        if (response) {
          // Success! Update assistant message
          assistantMessage.content = response.content;
          assistantMessage.status = 'completed';
          assistantMessage.jobId = response.jobId;
          assistantMessage.metadata = {
            ...response.metadata,
            provider: provider
          };
          
          this.updateSession();
          return assistantMessage;
        }
        
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error);
        lastError = error instanceof Error ? error : new Error(`Provider ${provider} failed`);
        continue; // Try next provider
      }
    }

    // All providers failed
    assistantMessage.content = 'I apologize, but I encountered an error processing your request. Please try again.';
    assistantMessage.status = 'error';
    assistantMessage.metadata = { 
      error: lastError?.message || 'All providers failed',
      provider: 'none'
    };
    
    this.updateSession();
    return assistantMessage;
  }

  /**
   * Process message through SIM-ONE Framework
   */
  private async processWithSIMONE(content: string, options: ProcessingOptions = {}) {
    if (!this.simoneService) {
      throw new Error('SIM-ONE service not configured');
    }

    // Test connection first
    const connectionTest = await this.simoneService.testConnection();
    if (!connectionTest.success) {
      throw new Error(`SIM-ONE connection failed: ${connectionTest.error?.message}`);
    }

    // Process through the five-agent pipeline
    const result = await this.simoneService.chat(content, this.buildContext());

    if (!result.success) {
      throw new Error(`SIM-ONE processing failed: ${result.error?.message}`);
    }

    return {
      content: result.data!.final_output,
      jobId: result.data!.job_id,
      metadata: {
        processingTime: result.data!.metadata.processing_time,
        qualityScore: result.data!.quality_metrics.overall_score,
        style: result.data!.metadata.style,
        protocolsApplied: result.data!.metadata.protocols_applied
      }
    };
  }

  /**
   * Fallback to OpenAI API for testing
   */
  private async processWithOpenAI(content: string) {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.config.openaiBaseURL || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are SIM-ONE, an AI assistant powered by a five-agent cognitive governance framework. Provide helpful, accurate, and thoughtful responses.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      metadata: { style: 'openai_fallback' }
    };
  }

  /**
   * Fallback to Anthropic Claude API
   */
  private async processWithAnthropic(content: string) {
    if (!this.config.anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const { processWithAnthropic } = await import('./anthropic-client');
    const result = await processWithAnthropic(
      content, 
      this.config.anthropicApiKey, 
      this.config.anthropicBaseURL
    );
    
    return {
      content: result.content,
      metadata: { 
        style: 'anthropic_claude',
        model: result.metadata?.model,
        usage: result.metadata?.usage
      }
    };
  }

  /**
   * Build conversation context for SIM-ONE
   */
  private buildContext(): string {
    if (!this.currentSession || this.currentSession.messages.length === 0) {
      return '';
    }

    // Get last few messages for context
    const recentMessages = this.currentSession.messages
      .filter(msg => msg.role !== 'system')
      .slice(-5)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return recentMessages;
  }

  /**
   * Add user message to current session
   */
  private addUserMessage(content: string): ChatMessage {
    if (!this.currentSession) {
      throw new Error('No active chat session');
    }

    const message: ChatMessage = {
      id: this.generateMessageId(),
      content,
      role: 'user',
      timestamp: Date.now(),
      status: 'completed'
    };

    this.currentSession.messages.push(message);
    this.updateSession();
    
    return message;
  }

  /**
   * Add system message to current session
   */
  private addSystemMessage(content: string): ChatMessage {
    if (!this.currentSession) {
      throw new Error('No active chat session');
    }

    const message: ChatMessage = {
      id: this.generateMessageId(),
      content,
      role: 'system',
      timestamp: Date.now(),
      status: 'completed'
    };

    this.currentSession.messages.push(message);
    this.updateSession();
    
    return message;
  }

  /**
   * Update session timestamp
   */
  private updateSession(): void {
    if (this.currentSession) {
      this.currentSession.updatedAt = Date.now();
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): ChatSession | null {
    return this.currentSession;
  }

  /**
   * Get session messages
   */
  getMessages(): ChatMessage[] {
    return this.currentSession?.messages || [];
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
  }

  /**
   * Test SIM-ONE connection
   */
  async testSIMONEConnection(): Promise<boolean> {
    if (!this.simoneService) {
      return false;
    }

    try {
      const result = await this.simoneService.testConnection();
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get available SIM-ONE styles
   */
  async getAvailableStyles() {
    if (!this.simoneService) {
      return null;
    }

    try {
      const result = await this.simoneService.getStyles();
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update client configuration
   */
  updateConfig(newConfig: Partial<SIMONEClientConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reinitialize SIM-ONE service if base URL changed
    if (newConfig.simoneBaseURL && this.config.simoneBaseURL) {
      this.simoneService = new SIMONEService({
        baseURL: this.config.simoneBaseURL,
        apiKey: this.config.simoneApiKey,
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts
      });
    }
  }

  /**
   * Get current configuration (excluding sensitive data)
   */
  getConfig(): Omit<SIMONEClientConfig, 'simoneApiKey' | 'openaiApiKey'> {
    const { simoneApiKey, openaiApiKey, ...safeConfig } = this.config;
    return safeConfig;
  }
}

// Export singleton instance for use across the application
let clientInstance: SIMONEClient | null = null;

export function getSIMONEClient(config?: SIMONEClientConfig): SIMONEClient {
  if (!clientInstance && config) {
    clientInstance = new SIMONEClient(config);
  }
  
  if (!clientInstance) {
    throw new Error('SIM-ONE client not initialized. Please provide configuration.');
  }
  
  return clientInstance;
}

export function initializeSIMONEClient(config: SIMONEClientConfig): SIMONEClient {
  clientInstance = new SIMONEClient(config);
  return clientInstance;
}

