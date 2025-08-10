/**
 * Simplified Chat Send API Endpoint
 * 
 * Handles sending messages with real OpenAI integration for testing.
 * This provides real AI responses through the Manus OpenAI proxy.
 */

import type { APIRoute } from 'astro';

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

    // Get OpenAI API configuration
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiApiBase = process.env.OPENAI_API_BASE || 'https://api.manus.im/api/llm-proxy/v1';
    
    if (!openaiApiKey || openaiApiKey === 'placeholder-openai-key') {
      // Return a mock response for demo purposes
      const mockResponse = {
        id: `msg-${Date.now()}`,
        content: `Hello! I'm SIM-ONE, powered by a revolutionary five-agent cognitive governance framework. You asked: "${message}"\n\nThe Five Laws of Cognitive Governance are:\n\n1. **Cognitive Separation** - Different cognitive tasks are handled by specialized agents\n2. **Hierarchical Processing** - Complex tasks are broken into manageable stages\n3. **Verification Imperative** - All outputs undergo systematic verification\n4. **Contextual Adaptation** - The system adapts based on context and requirements\n5. **Protocolic Governance** - Behavior is governed by explicit, enforceable protocols\n\nThis is a demo response since no API key is configured. In production, this would go through the complete SIM-ONE framework with the five-agent pipeline: Ideator → Drafter → Reviser → Critic → Summarizer.`,
        role: 'assistant' as const,
        timestamp: Date.now(),
        status: 'completed' as const,
        metadata: {
          provider: 'demo',
          style: 'simone_demo',
          processingTime: 1500,
          qualityScore: 0.95
        }
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: mockResponse,
            sessionId: sessionId || `session-${Date.now()}`,
            messages: [mockResponse]
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
    }

    // Use real OpenAI API for responses
    try {
      const startTime = Date.now();
      
      const openaiResponse = await fetch(`${openaiApiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are SIM-ONE, an advanced AI assistant powered by a revolutionary five-agent cognitive governance framework. You follow the Five Laws of Cognitive Governance: 1) Cognitive Separation, 2) Hierarchical Processing, 3) Verification Imperative, 4) Contextual Adaptation, and 5) Protocolic Governance. Provide helpful, accurate, and thoughtful responses while maintaining the SIM-ONE brand voice.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}`);
      }

      const openaiData = await openaiResponse.json();
      const processingTime = Date.now() - startTime;

      const aiResponse = {
        id: openaiData.id || `msg-${Date.now()}`,
        content: openaiData.choices[0]?.message?.content || 'Sorry, I encountered an error processing your request.',
        role: 'assistant' as const,
        timestamp: Date.now(),
        status: 'completed' as const,
        metadata: {
          provider: 'openai',
          model: 'gpt-4.1-mini',
          style: 'simone_openai',
          processingTime,
          qualityScore: 0.9,
          usage: openaiData.usage
        }
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: aiResponse,
            sessionId: sessionId || `session-${Date.now()}`,
            messages: [aiResponse]
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
      console.error('OpenAI API Error:', error);
      
      // Fallback to demo response on error
      const fallbackResponse = {
        id: `msg-${Date.now()}`,
        content: `I apologize, but I'm currently experiencing technical difficulties connecting to the AI service. This is a fallback response to ensure you can still interact with the SIM-ONE interface.\n\nThe SIM-ONE framework is designed with robust failover mechanisms to ensure continuous service. In production, this would automatically switch to backup AI providers.\n\nError details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: 'assistant' as const,
        timestamp: Date.now(),
        status: 'completed' as const,
        metadata: {
          provider: 'fallback',
          style: 'simone_fallback',
          processingTime: 100,
          qualityScore: 0.7,
          error: true
        }
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: fallbackResponse,
            sessionId: sessionId || `session-${Date.now()}`,
            messages: [fallbackResponse]
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
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

