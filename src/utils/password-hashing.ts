/**
 * Modern Password Hashing Utility using Argon2
 * 
 * Implements enterprise-grade password hashing following security best practices.
 * Uses Argon2id variant which is recommended by OWASP and security experts.
 */

import argon2 from 'argon2';

/**
 * Argon2 configuration following OWASP recommendations
 */
const ARGON2_CONFIG = {
  type: argon2.argon2id,        // Argon2id variant (recommended)
  memoryCost: 2 ** 16,          // 64 MB memory cost
  timeCost: 3,                  // 3 iterations
  parallelism: 1,               // Single thread
  hashLength: 32,               // 32-byte hash output
  saltLength: 16,               // 16-byte salt
};

/**
 * Hash a password using Argon2id
 * 
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password with embedded salt and parameters
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || password.length < 1) {
      throw new Error('Password cannot be empty');
    }

    // Argon2 automatically generates a random salt and embeds it in the hash
    const hashedPassword = await argon2.hash(password, ARGON2_CONFIG);
    
    console.log('✅ Password hashed successfully using Argon2id');
    return hashedPassword;
    
  } catch (error) {
    console.error('❌ Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against its hash
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Previously hashed password to compare against
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    if (!password || !hashedPassword) {
      return false;
    }

    // Argon2 automatically extracts salt and parameters from the hash
    const isValid = await argon2.verify(hashedPassword, password);
    
    if (isValid) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }
    
    return isValid;
    
  } catch (error) {
    console.error('❌ Password verification error:', error);
    return false;
  }
}

/**
 * Check if a password hash needs to be rehashed (for security upgrades)
 * 
 * @param hashedPassword - Previously hashed password to check
 * @returns boolean - True if rehashing is needed
 */
export function needsRehash(hashedPassword: string): boolean {
  try {
    // Check if the hash uses current Argon2 parameters
    return argon2.needsRehash(hashedPassword, ARGON2_CONFIG);
  } catch (error) {
    console.error('❌ Rehash check failed:', error);
    return true; // Assume rehash is needed if check fails
  }
}

/**
 * Generate a secure random password for testing or temporary accounts
 * 
 * @param length - Length of the password (default: 16)
 * @returns string - Cryptographically secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Use crypto.getRandomValues for cryptographically secure randomness
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  return password;
}

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @returns object - Validation result with score and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain special characters');
  }

  // Common pattern checks
  if (!/(.)\1{2,}/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should not contain repeated characters');
  }

  const isValid = score >= 5 && feedback.length === 0;

  return {
    isValid,
    score,
    feedback
  };
}

