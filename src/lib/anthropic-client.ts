/**
 * Anthropic Client Integration
 * 
 * Provides Anthropic Claude API support as an additional model option.
 * Part of the dual-level model switching architecture.
 */

export interface AnthropicResponse {
  content: string;
  metadata?: {
    model?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

export async function processWithAnthropic(
  content: string,
  apiKey: string,
  baseURL?: string
): Promise<AnthropicResponse> {
  const url = baseURL || 'https://api.anthropic.com/v1/messages';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
      system: 'You are SIM-ONE, an AI assistant powered by a five-agent cognitive governance framework. Provide helpful, accurate, and thoughtful responses.'
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.content[0].text,
    metadata: {
      model: data.model,
      usage: data.usage
    }
  };
}

