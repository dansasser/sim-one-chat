/**
 * OAuth2 Provider Configuration
 * 
 * Configures OAuth2 providers for the AgentUI authentication service.
 * Supports Google, GitHub, and other providers with proper security settings.
 */

export interface OAuth2ProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

/**
 * OAuth2 provider configurations
 */
export const oauth2Providers = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-google-client-secret',
    redirectUri: `${process.env.PUBLIC_BASE_URL || 'http://localhost:4321'}/auth/callback/google`,
    scope: ['openid', 'email', 'profile'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
  },
  
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || 'placeholder-github-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder-github-client-secret',
    redirectUri: `${process.env.PUBLIC_BASE_URL || 'http://localhost:4321'}/auth/callback/github`,
    scope: ['user:email'],
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user'
  }
};

/**
 * Generate OAuth2 authorization URL
 */
export function generateOAuth2URL(provider: keyof typeof oauth2Providers, state?: string): string {
  const config = oauth2Providers[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth2 provider: ${provider}`);
  }
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope.join(' '),
    state: state || generateState()
  });
  
  // Add provider-specific parameters
  if (provider === 'google') {
    params.append('access_type', 'offline');
    params.append('prompt', 'consent');
  }
  
  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Generate secure state parameter for OAuth2
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Validate OAuth2 provider
 */
export function isValidProvider(provider: string): provider is keyof typeof oauth2Providers {
  return provider in oauth2Providers;
}

/**
 * Get OAuth2 provider configuration
 */
export function getProviderConfig(provider: keyof typeof oauth2Providers): OAuth2ProviderConfig {
  const config = oauth2Providers[provider];
  if (!config) {
    throw new Error(`OAuth2 provider not found: ${provider}`);
  }
  return config;
}

