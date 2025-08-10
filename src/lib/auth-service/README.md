# AgentUI Authentication Service

Enterprise-grade authentication service with triple authentication support (API Key, JWT, OAuth2) and seamless Astro SSR integration. Now featuring Argon2 password hashing for maximum security.

## 🔐 Security Features

- **Argon2id Password Hashing**: Winner of the Password Hashing Competition, resistant to GPU/ASIC attacks
- **Triple Authentication**: API Key → JWT → OAuth2 sequential validation
- **Session Management**: Secure server-side session handling with automatic cleanup
- **Astro SSR Integration**: Native middleware support for Astro applications
- **Enterprise Security**: Rate limiting, CORS protection, security headers
- **Comprehensive Logging**: Full audit trail with correlation ID tracking

## 🚀 Quick Start

### Installation

```bash
npm install @agentui/auth-service
```

### Basic Usage

```typescript
import { AuthService } from '@agentui/auth-service';

const authService = new AuthService({
  jwtSecret: 'your-secret-key',
  jwtExpiresIn: '15m',
  argon2: {
    memoryCost: 65536,    // 64MB
    timeCost: 3,          // 3 iterations
    parallelism: 4,       // 4 threads
    hashLength: 32        // 32 bytes
  },
  sessionManager: new SessionManager()
});
```

### Astro Integration

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { createAstroAuthMiddleware } from '@agentui/auth-service/astro';

export const onRequest = defineMiddleware(
  createAstroAuthMiddleware({
    jwtSecret: process.env.JWT_SECRET,
    protectedRoutes: ['/chat', '/dashboard'],
    loginRedirect: '/login'
  })
);
```

## 🔧 Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secure-secret-key
JWT_EXPIRES_IN=15m

# Argon2 Configuration
ARGON2_MEMORY=65536      # Memory cost in KB (64MB)
ARGON2_TIME=3            # Time cost iterations
ARGON2_PARALLELISM=4     # Parallelism threads
ARGON2_HASH_LENGTH=32    # Hash length in bytes

# Session Configuration
SESSION_TIMEOUT=3600000  # 1 hour in milliseconds
CLEANUP_INTERVAL=300000  # 5 minutes in milliseconds

# Server Configuration
PORT=3001
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Argon2 Security Parameters

The service uses Argon2id with security-optimized parameters:

- **Memory Cost**: 64MB (65536 KB) - Resistant to GPU attacks
- **Time Cost**: 3 iterations - Balanced security/performance
- **Parallelism**: 4 threads - Optimal for server hardware
- **Hash Length**: 32 bytes - Cryptographically secure output

## 📚 API Reference

### Authentication Methods

#### API Key Authentication

```typescript
const result = await authService.authenticate({
  method: 'api-key',
  config: {
    apiKey: 'agentui_your-api-key-here',
    permissions: ['basic', 'chat']
  }
});
```

#### JWT Authentication

```typescript
const result = await authService.authenticate({
  method: 'jwt',
  config: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    secret: 'your-jwt-secret' // optional, uses service default
  }
});
```

#### OAuth2 Authentication

```typescript
const result = await authService.authenticate({
  method: 'oauth2',
  config: {
    provider: 'google',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'https://yourapp.com/auth/callback'
  }
});
```

### Password Utilities

```typescript
import { hashPassword, verifyPassword, validatePasswordStrength } from '@agentui/auth-service/utils';

// Hash a password
const hash = await hashPassword('user-password');

// Verify a password
const isValid = await verifyPassword('user-password', hash);

// Validate password strength
const strength = validatePasswordStrength('user-password');
console.log(strength.score, strength.isValid, strength.feedback);
```

### Session Management

```typescript
// Validate session
const session = await authService.validateSession(sessionId);

// Refresh session
const newSession = await authService.refreshSession(sessionId);

// Destroy session
await authService.destroySession(sessionId);
```

## 🏗️ Astro Integration Guide

### 1. Install and Configure

```bash
npm install @agentui/auth-service
```

### 2. Create Middleware

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { createAstroAuthMiddleware } from '@agentui/auth-service/astro';

export const onRequest = defineMiddleware(
  createAstroAuthMiddleware({
    jwtSecret: process.env.JWT_SECRET!,
    protectedRoutes: ['/chat', '/dashboard', '/admin'],
    publicRoutes: ['/login', '/register', '/'],
    loginRedirect: '/login',
    enableLogging: true
  })
);
```

### 3. Use in Pages

```astro
---
// src/pages/dashboard.astro
const { isAuthenticated, user } = Astro.locals;

if (!isAuthenticated) {
  return Astro.redirect('/login');
}
---

<html>
  <head>
    <title>Dashboard - Welcome {user.name}</title>
  </head>
  <body>
    <h1>Welcome, {user.name}!</h1>
    <p>User ID: {user.id}</p>
    <p>Permissions: {user.permissions.join(', ')}</p>
  </body>
</html>
```

### 4. API Routes

```typescript
// src/pages/api/protected.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.isAuthenticated) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication required'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    user: locals.user,
    message: 'Access granted'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## 🔄 Migration from bcrypt

If you're migrating from bcrypt, the service automatically handles the transition:

1. **Update Dependencies**: The package.json now uses `argon2` instead of `bcryptjs`
2. **Configuration**: Replace `bcryptRounds` with `argon2` configuration object
3. **Password Hashing**: All new passwords use Argon2id automatically
4. **Existing Passwords**: Consider implementing a gradual migration strategy

### Migration Strategy

```typescript
// During user login, check if password needs rehashing
const isValid = await verifyPassword(password, user.hashedPassword);
if (isValid && needsRehash(user.hashedPassword)) {
  // Update to new Argon2 hash
  const newHash = await hashPassword(password);
  await updateUserPassword(user.id, newHash);
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📊 Performance

### Argon2 Benchmarks

- **Hashing Time**: ~100-200ms (security-optimized)
- **Memory Usage**: 64MB per hash operation
- **Verification Time**: ~100-200ms (constant-time)
- **Resistance**: GPU/ASIC attack resistant

### Authentication Performance

- **API Key Validation**: 1-5ms (fastest)
- **JWT Validation**: 5-15ms (stateless)
- **OAuth2 Validation**: 50-500ms (network dependent)
- **Session Validation**: 10-20ms (in-memory)

## 🔒 Security Best Practices

1. **Environment Variables**: Never hardcode secrets in source code
2. **HTTPS Only**: Always use HTTPS in production
3. **Session Timeout**: Configure appropriate session timeouts
4. **Rate Limiting**: Enable rate limiting for authentication endpoints
5. **Monitoring**: Monitor authentication failures and suspicious activity
6. **Regular Updates**: Keep dependencies updated for security patches

## 🐛 Troubleshooting

### Common Issues

#### "Invalid JWT Secret"
- Ensure `JWT_SECRET` environment variable is set
- Use a strong, random secret (minimum 32 characters)

#### "Argon2 Hashing Failed"
- Check available memory (requires 64MB per operation)
- Verify Node.js version compatibility (Node 14+)

#### "Session Not Found"
- Check session timeout configuration
- Verify session cleanup is not too aggressive

#### "CORS Errors"
- Configure `ALLOWED_ORIGINS` environment variable
- Ensure frontend domain is included in allowed origins

### Debug Mode

Enable debug logging:

```typescript
const authService = new AuthService({
  // ... config
  enableLogging: true
});
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/agentui/auth-service/issues)
- Documentation: [Full documentation](https://docs.agentui.com/auth-service)
- Email: support@agentui.com

---

**AgentUI Authentication Service** - Secure, scalable, and Astro-ready authentication for modern web applications.

