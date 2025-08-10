/**
 * AgentUI Authentication Service - Clean Export
 * Enterprise-grade authentication with triple security layers
 */

// Export the clean, working auth service
export * from './services/auth-service-clean';

// Default configuration
export const defaultAuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: '15m',
  argon2: {
    memoryCost: 65536,    // 64MB
    timeCost: 3,          // 3 iterations
    parallelism: 4,       // 4 threads
    hashLength: 32        // 32 bytes
  },
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  enableLogging: process.env.NODE_ENV !== 'production'
};

