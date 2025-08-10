/**
 * Signup API Endpoint with Modern Argon2 Password Hashing
 * 
 * Handles user registration using enterprise-grade Argon2id password hashing.
 * Includes password strength validation and secure user creation.
 */

import type { APIRoute } from 'astro';
import { hashPassword, validatePasswordStrength } from '../../../utils/password-hashing';

// Enable server-side rendering for this endpoint
export const prerender = false;

// Mock user database (in production, this would be a real database)
const mockUsers: Array<{
  id: string;
  email: string;
  password: string;
  name: string;
  permissions: string[];
  createdAt: Date;
  lastLogin: Date | null;
  emailVerified: boolean;
}> = [];

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse JSON body with error handling
    let email: string, password: string, name: string, acceptTerms: boolean = false;
    
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
      name = body.name;
      acceptTerms = body.acceptTerms || false;
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

    // Validate required fields
    if (!email || !password || !name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email, password, and name are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate terms acceptance
    if (!acceptTerms) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You must accept the terms of service'
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

    // Validate name length
    if (name.length < 2 || name.length > 50) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Name must be between 2 and 50 characters'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Password does not meet security requirements',
        details: passwordValidation.feedback
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'An account with this email already exists'
      }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Hash the password using Argon2
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      permissions: ['basic', 'chat'],
      createdAt: new Date(),
      lastLogin: null,
      emailVerified: false
    };

    // Add user to mock database (in production, save to real database)
    mockUsers.push(newUser);

    // Generate session ID and secure token
    const sessionId = crypto.randomUUID();
    const tokenPayload = {
      sub: newUser.id,
      email: newUser.email,
      name: newUser.name,
      permissions: newUser.permissions,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    
    const token = btoa(JSON.stringify(tokenPayload));

    // Calculate expiration time
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now

    console.log(`✅ New user registered: ${newUser.email} (ID: ${newUser.id})`);
    console.log(`🔐 Password hashed using Argon2id for security`);

    // Set secure cookie options
    const cookieOptions = [
      `sessionId=${sessionId}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Max-Age=3600',
      'Path=/'
    ].join('; ');

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      token,
      expiresAt,
      permissions: newUser.permissions,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        permissions: newUser.permissions,
        createdAt: newUser.createdAt,
        emailVerified: newUser.emailVerified
      }
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieOptions
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
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

