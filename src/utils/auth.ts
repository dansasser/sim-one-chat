import type { AstroCookies } from 'astro';

export interface User {
  email: string;
  name?: string;
  createdAt: string;
  verified?: boolean;
}

export interface SessionData {
  email: string;
  createdAt: string;
  rememberMe: boolean;
}

/**
 * Get the current user from the session cookie
 */
export async function getCurrentUser(cookies: AstroCookies): Promise<User | null> {
  try {
    const sessionCookie = cookies.get('session');
    
    if (!sessionCookie?.value) {
      return null;
    }

    // Decode session token
    const sessionData = decodeSessionToken(sessionCookie.value);
    
    if (!sessionData) {
      return null;
    }

    // Check if session is expired
    if (isSessionExpired(sessionData)) {
      return null;
    }

    // TODO: Replace with actual user lookup from database
    const user = await getUserByEmail(sessionData.email);
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(cookies: AstroCookies): Promise<boolean> {
  const user = await getCurrentUser(cookies);
  return user !== null;
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(cookies: AstroCookies, redirectUrl?: string): Promise<User | Response> {
  const user = await getCurrentUser(cookies);
  
  if (!user) {
    const loginUrl = redirectUrl 
      ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
      : '/login';
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: loginUrl
      }
    });
  }
  
  return user;
}

/**
 * Decode session token
 */
function decodeSessionToken(token: string): SessionData | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const sessionData = JSON.parse(decoded) as SessionData;
    
    // Validate required fields
    if (!sessionData.email || !sessionData.createdAt) {
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Error decoding session token:', error);
    return null;
  }
}

/**
 * Check if session is expired
 */
function isSessionExpired(sessionData: SessionData): boolean {
  const createdAt = new Date(sessionData.createdAt);
  const now = new Date();
  
  // Session expires after 24 hours (or 30 days if remember me)
  const expirationHours = sessionData.rememberMe ? 30 * 24 : 24;
  const expirationMs = expirationHours * 60 * 60 * 1000;
  
  return (now.getTime() - createdAt.getTime()) > expirationMs;
}

/**
 * Get user by email - TODO: Replace with actual database lookup
 */
async function getUserByEmail(email: string): Promise<User | null> {
  // This would normally query your user database
  // For development, return a mock user
  
  return {
    email,
    name: email.split('@')[0], // Use email prefix as name
    createdAt: new Date().toISOString(),
    verified: true
  };
}

/**
 * Clear authentication session
 */
export function clearSession(cookies: AstroCookies): void {
  cookies.delete('session', {
    path: '/'
  });
}

/**
 * Get authentication state for client-side components
 */
export function getAuthState(user: User | null) {
  return {
    isAuthenticated: user !== null,
    user: user ? {
      email: user.email,
      name: user.name,
      verified: user.verified
    } : null
  };
}

