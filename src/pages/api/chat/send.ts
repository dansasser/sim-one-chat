/**
 * Chat Send API Endpoint
 * 
 * Handles sending messages to SIM-ONE Framework through the AgentUI SDK.
 * Implements proper error handling and fallback mechanisms.
 */

import type { APIRoute } from 'astro';
import { getSIMONEClient, initializeSIMONEClient } from '../../../lib/simone-client';

// Enable server-side rendering for this endpoint
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { message, sessionId, isAuthenticated, userId } = body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message content is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize SIM-ONE client with dual-level model switching configuration
    const client = initializeSIMONEClient({
      // Level 1: SIM-ONE Framework (backend uses OpenAI until MVL model is ready)
      simoneBaseURL: process.env.SIMONE_API_URL,
      simoneApiKey: process.env.SIMONE_API_KEY,
      
      // Level 2: Direct API fallbacks (SDK level)
      openaiApiKey: process.env.OPENAI_API_KEY,
      openaiBaseURL: process.env.OPENAI_API_BASE,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      anthropicBaseURL: process.env.ANTHROPIC_BASE_URL,
      
      // Model switching configuration
      preferredProvider: 'simone', // Always prefer SIM-ONE Framework first
      enableFallback: true,
      fallbackOrder: ['simone', 'openai', 'anthropic'], // Try in this order
      
      // Performance settings
      timeout: parseInt(process.env.RESPONSE_TIME_THRESHOLD || '30000'),
      retryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
    });

    // Initialize or get existing session
    let session = client.getCurrentSession();
    if (!session || session.id !== sessionId) {
      session = client.initializeSession(isAuthenticated, userId);
    }

    // Send message and get response
    const assistantMessage = await client.sendMessage(message.trim());

    // Return the response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: assistantMessage,
          sessionId: session.id,
          messages: client.getMessages()
        }
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );

  } catch (error) {
    console.error('Chat send error:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST to send messages.'
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

