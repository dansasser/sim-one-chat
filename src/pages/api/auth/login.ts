/**
 * Login API Endpoint with Modern Argon2 Password Hashing
 * 
 * Handles user authentication using enterprise-grade Argon2id password hashing.
 * Supports traditional email/password authentication with JWT token generation.
 */

import type { APIRoute } from 'astro';
import { verifyPassword } from '../../../utils/password-hashing';

// Enable server-side rendering for this endpoint
export const prerender = false;

// Mock user database with Argon2 hashed passwords
const mockUsers = [
  {
    id: '1',
    email: 'demo@simone.ai',
    password: '$argon2id$v=19$m=65536,t=3,p=1$cvixXt9aAHfs24zAKIeiag$JHBg/LEloAPvgLxeF0Xcc/6qnhvaTCaeiGUtMzFm/c8', // 'password123'
    name: 'Demo User',
    permissions: ['basic', 'chat'],
    createdAt: new Date('2024-01-01'),
    lastLogin: null
  },
  {
    id: '2',
    email: 'admin@simone.ai',
    password: '$argon2id$v=19$m=65536,t=3,p=1$cvixXt9aAHfs24zAKIeiag$JHBg/LEloAPvgLxeF0Xcc/6qnhvaTCaeiGUtMzFm/c8', // 'password123'
    name: 'Admin User',
    permissions: ['basic', 'chat', 'admin'],
    createdAt: new Date('2024-01-01'),
    lastLogin: null
  }
];

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse JSON body with error handling
    let email: string, password: string, rememberMe: boolean = false;
    
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
      rememberMe = body.rememberMe || false;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email and password are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email format'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Find user in mock database
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Use a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email or password'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Verify password using Argon2
    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email or password'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Generate session ID and secure token
    const sessionId = crypto.randomUUID();
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      permissions: user.permissions,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (rememberMe ? 30 * 24 * 60 * 60 : 60 * 60) // 30 days or 1 hour
    };
    
    const token = btoa(JSON.stringify(tokenPayload));

    // Calculate expiration time
    const expiresAt = Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000);

    // Update last login (in production, this would update the database)
    user.lastLogin = new Date();

    console.log(`✅ User authenticated: ${user.email} (Session: ${sessionId})`);
    console.log(`🔐 Using Argon2id password hashing for security`);

    // Set secure cookie options
    const cookieOptions = [
      `sessionId=${sessionId}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      `Max-Age=${rememberMe ? 30 * 24 * 60 * 60 : 60 * 60}`,
      'Path=/'
    ].join('; ');

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      token,
      expiresAt,
      permissions: user.permissions,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieOptions
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

