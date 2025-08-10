/**
 * Comprehensive Test Suite for AgentUI Auth Service with Argon2
 * 
 * Tests all authentication methods, password utilities, and Astro integration
 * following the Five Laws of Cognitive Governance principles.
 */

import { AuthService, AuthServiceConfig, Argon2Config } from '../services/auth-service';
import { SessionManager } from '../services/session-manager';
import { hashPassword, verifyPassword, validatePasswordStrength, needsRehash } from '../utils/password-utils';
import { createAstroAuthMiddleware, hasPermission, requirePermission } from '../middleware/astro-middleware';

describe('AgentUI Auth Service with Argon2', () => {
  let authService: AuthService;
  let sessionManager: SessionManager;
  
  const testConfig: AuthServiceConfig = {
    jwtSecret: 'test-secret-key-for-testing-only',
    jwtExpiresIn: '1h',
    argon2: {
      memoryCost: 4096,    // Reduced for testing (4MB)
      timeCost: 2,         // Reduced for testing
      parallelism: 2,      // Reduced for testing
      hashLength: 32
    },
    sessionManager: new SessionManager({
      sessionTimeout: 60 * 60 * 1000, // 1 hour
      cleanupInterval: 5 * 60 * 1000   // 5 minutes
    })
  };

  beforeEach(() => {
    sessionManager = testConfig.sessionManager;
    authService = new AuthService(testConfig);
  });

  afterEach(async () => {
    // Clean up sessions after each test
    await sessionManager.cleanup();
  });

  describe('Password Utilities with Argon2', () => {
    test('should hash password with argon2', async () => {
      const password = 'test-password-123';
      const hash = await hashPassword(password, testConfig.argon2);
      
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$argon2id\$/);
      expect(hash.length).toBeGreaterThan(50);
    });

    test('should verify password correctly', async () => {
      const password = 'test-password-123';
      const hash = await hashPassword(password, testConfig.argon2);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('wrong-password', hash);
      expect(isInvalid).toBe(false);
    });

    test('should validate password strength', () => {
      const weakPassword = '123';
      const strongPassword = 'MyStr0ng!P@ssw0rd2024';
      
      const weakResult = validatePasswordStrength(weakPassword);
      expect(weakResult.isValid).toBe(false);
      expect(weakResult.score).toBeLessThan(6);
      expect(weakResult.feedback.length).toBeGreaterThan(0);
      
      const strongResult = validatePasswordStrength(strongPassword);
      expect(strongResult.isValid).toBe(true);
      expect(strongResult.score).toBeGreaterThanOrEqual(6);
    });

    test('should detect when hash needs rehashing', async () => {
      const password = 'test-password';
      const hash = await hashPassword(password, testConfig.argon2);
      
      // Same config should not need rehash
      expect(needsRehash(hash, testConfig.argon2)).toBe(false);
      
      // Different config should need rehash
      const newConfig: Argon2Config = {
        ...testConfig.argon2,
        memoryCost: 8192 // Different memory cost
      };
      expect(needsRehash(hash, newConfig)).toBe(true);
    });
  });

  describe('API Key Authentication', () => {
    test('should authenticate valid API key', async () => {
      const result = await authService.authenticate({
        method: 'api-key' as any,
        config: {
          apiKey: 'agentui_test-api-key-with-sufficient-length-12345',
          permissions: ['basic', 'chat']
        }
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.permissions).toContain('basic');
      expect(result.sessionId).toBeDefined();
    });

    test('should reject invalid API key', async () => {
      const result = await authService.authenticate({
        method: 'api-key' as any,
        config: {
          apiKey: 'invalid-key',
          permissions: ['basic']
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('JWT Authentication', () => {
    test('should authenticate valid JWT token', async () => {
      // First create a user to get a valid JWT
      const apiKeyResult = await authService.authenticate({
        method: 'api-key' as any,
        config: {
          apiKey: 'agentui_test-api-key-with-sufficient-length-12345',
          permissions: ['basic']
        }
      });

      expect(apiKeyResult.success).toBe(true);
      expect(apiKeyResult.token).toBeDefined();

      // Now test JWT authentication with the token
      const jwtResult = await authService.authenticate({
        method: 'jwt' as any,
        config: {
          token: apiKeyResult.token!,
          secret: testConfig.jwtSecret
        }
      });

      expect(jwtResult.success).toBe(true);
      expect(jwtResult.user).toBeDefined();
    });

    test('should reject invalid JWT token', async () => {
      const result = await authService.authenticate({
        method: 'jwt' as any,
        config: {
          token: 'invalid.jwt.token',
          secret: testConfig.jwtSecret
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Session Management', () => {
    test('should validate active session', async () => {
      // Create a session first
      const authResult = await authService.authenticate({
        method: 'api-key' as any,
        config: {
          apiKey: 'agentui_test-api-key-with-sufficient-length-12345',
          permissions: ['basic']
        }
      });

      expect(authResult.success).toBe(true);
      expect(authResult.sessionId).toBeDefined();

      // Validate the session
      const sessionResult = await authService.validateSession(authResult.sessionId!);
      expect(sessionResult.success).toBe(true);
      expect(sessionResult.user).toBeDefined();
    });

    test('should reject invalid session', async () => {
      const result = await authService.validateSession('invalid-session-id');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should refresh session', async () => {
      // Create a session first
      const authResult = await authService.authenticate({
        method: 'api-key' as any,
        config: {
          apiKey: 'agentui_test-api-key-with-sufficient-length-12345',
          permissions: ['basic']
        }
      });

      expect(authResult.success).toBe(true);
      expect(authResult.sessionId).toBeDefined();

      // Refresh the session
      const refreshResult = await authService.refreshSession(authResult.sessionId!);
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.sessionId).toBeDefined();
      expect(refreshResult.sessionId).not.toBe(authResult.sessionId);
    });

    test('should destroy session', async () => {
      // Create a session first
      const authResult = await authService.authenticate({
        method: 'api-key' as any,
        config: {
          apiKey: 'agentui_test-api-key-with-sufficient-length-12345',
          permissions: ['basic']
        }
      });

      expect(authResult.success).toBe(true);
      expect(authResult.sessionId).toBeDefined();

      // Destroy the session
      const destroyResult = await authService.destroySession(authResult.sessionId!);
      expect(destroyResult.success).toBe(true);

      // Verify session is destroyed
      const validateResult = await authService.validateSession(authResult.sessionId!);
      expect(validateResult.success).toBe(false);
    });
  });

  describe('Astro Middleware Integration', () => {
    test('should create middleware with default config', () => {
      const middleware = createAstroAuthMiddleware();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    test('should check user permissions correctly', () => {
      const user = {
        id: 'test-user',
        permissions: ['basic', 'chat']
      };

      expect(hasPermission(user, 'basic')).toBe(true);
      expect(hasPermission(user, 'chat')).toBe(true);
      expect(hasPermission(user, 'admin')).toBe(false);
      expect(hasPermission(null, 'basic')).toBe(false);
    });

    test('should require permissions correctly', () => {
      const user = {
        id: 'test-user',
        permissions: ['basic', 'chat']
      };

      expect(() => requirePermission(user, 'basic')).not.toThrow();
      expect(() => requirePermission(user, 'chat')).not.toThrow();
      expect(() => requirePermission(user, 'admin')).toThrow();
      expect(() => requirePermission(null, 'basic')).toThrow();
    });

    test('should handle admin permissions', () => {
      const adminUser = {
        id: 'admin-user',
        permissions: ['admin']
      };

      expect(hasPermission(adminUser, 'basic')).toBe(true);
      expect(hasPermission(adminUser, 'chat')).toBe(true);
      expect(hasPermission(adminUser, 'admin')).toBe(true);
      expect(hasPermission(adminUser, 'any-permission')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication service errors gracefully', async () => {
      // Test with malformed config
      const result = await authService.authenticate({
        method: 'invalid-method' as any,
        config: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Unsupported authentication method');
    });

    test('should handle password hashing errors', async () => {
      // Test with invalid config
      const invalidConfig: Argon2Config = {
        memoryCost: -1,  // Invalid memory cost
        timeCost: 0,     // Invalid time cost
        parallelism: 0,  // Invalid parallelism
        hashLength: 0    // Invalid hash length
      };

      await expect(hashPassword('test', invalidConfig)).rejects.toThrow();
    });

    test('should handle password verification errors gracefully', async () => {
      // Test with invalid hash format
      const result = await verifyPassword('password', 'invalid-hash-format');
      expect(result).toBe(false);
    });
  });

  describe('Performance and Security', () => {
    test('should hash passwords within reasonable time', async () => {
      const password = 'test-password-for-performance';
      const startTime = Date.now();
      
      await hashPassword(password, testConfig.argon2);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds (generous for testing)
      expect(duration).toBeLessThan(5000);
    });

    test('should verify passwords within reasonable time', async () => {
      const password = 'test-password-for-performance';
      const hash = await hashPassword(password, testConfig.argon2);
      
      const startTime = Date.now();
      await verifyPassword(password, hash);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds (generous for testing)
      expect(duration).toBeLessThan(5000);
    });

    test('should generate unique hashes for same password', async () => {
      const password = 'same-password';
      
      const hash1 = await hashPassword(password, testConfig.argon2);
      const hash2 = await hashPassword(password, testConfig.argon2);
      
      expect(hash1).not.toBe(hash2); // Different salts should produce different hashes
      
      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete authentication flow', async () => {
      // 1. Authenticate with API key
      const authResult = await authService.authenticate({
        method: 'api-key' as any,
        config: {
          apiKey: 'agentui_test-api-key-with-sufficient-length-12345',
          permissions: ['basic', 'chat']
        }
      });

      expect(authResult.success).toBe(true);
      expect(authResult.sessionId).toBeDefined();
      expect(authResult.token).toBeDefined();

      // 2. Validate session
      const sessionResult = await authService.validateSession(authResult.sessionId!);
      expect(sessionResult.success).toBe(true);

      // 3. Use JWT token for subsequent requests
      const jwtResult = await authService.authenticate({
        method: 'jwt' as any,
        config: {
          token: authResult.token!
        }
      });

      expect(jwtResult.success).toBe(true);

      // 4. Refresh session
      const refreshResult = await authService.refreshSession(authResult.sessionId!);
      expect(refreshResult.success).toBe(true);

      // 5. Clean up
      const destroyResult = await authService.destroySession(refreshResult.sessionId!);
      expect(destroyResult.success).toBe(true);
    });

    test('should maintain security throughout authentication flow', async () => {
      const password = 'secure-test-password-123!';
      
      // 1. Hash password securely
      const hash = await hashPassword(password, testConfig.argon2);
      expect(hash).toMatch(/^\$argon2id\$/);

      // 2. Verify password
      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword('wrong-password', hash)).toBe(false);

      // 3. Check password strength
      const strength = validatePasswordStrength(password);
      expect(strength.isValid).toBe(true);

      // 4. Authenticate and create session
      const authResult = await authService.authenticate({
        method: 'api-key' as any,
        config: {
          apiKey: 'agentui_test-api-key-with-sufficient-length-12345',
          permissions: ['basic']
        }
      });

      expect(authResult.success).toBe(true);
      expect(authResult.sessionId).toBeDefined();

      // 5. Validate session security
      const sessionResult = await authService.validateSession(authResult.sessionId!);
      expect(sessionResult.success).toBe(true);
      expect(sessionResult.user?.permissions).toContain('basic');
    });
  });
});

// Test configuration and setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
});

afterAll(() => {
  // Clean up test environment
  delete process.env.JWT_SECRET;
});

