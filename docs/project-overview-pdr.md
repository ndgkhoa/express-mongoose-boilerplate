# Project Overview & PDR

## Project Summary

**Name:** express-mongoose-boilerplate  
**Version:** 1.0.0  
**Type:** Production-ready Node.js REST API boilerplate  
**Description:** Enterprise-grade backend foundation built with Express 5, TypeScript, MongoDB, and modern best practices. Includes authentication, authorization, file uploads, email delivery, background jobs, and comprehensive security middleware.

## Target Audience

- Backend developers building REST APIs with Node.js/Express
- Teams adopting TypeScript for better code quality
- Projects requiring multi-provider authentication
- Applications needing robust security patterns (rate limiting, account locking, OTP verification)
- Developers seeking modular, maintainable server architecture

## Business Goals

1. **Reduce Time-to-Market:** Eliminate repetitive boilerplate for authentication, middleware, and configuration
2. **Ensure Security:** Implement production-grade security patterns (password hashing, rate limiting, CSRF protection, account lockout)
3. **Maintain Quality:** Enforce code standards via linting, formatting, and commit hooks
4. **Enable Scalability:** Use Redis for sessions/caching, MongoDB for flexible data models
5. **Facilitate Maintenance:** Clear module structure, comprehensive error handling, and self-documenting code

## Key Features

### Authentication & Authorization

- **Multi-method login:** OTP-based sign-in (SMS/email verification flow)
- **Account security:** Failed login tracking, account locking (configurable attempts/duration)
- **Password management:** Secure hashing (argon2), reset flow via OTP
- **Token system:** Access tokens (short-lived) + refresh tokens (long-lived) with rotation detection
- **Multi-provider support:** Local (email/password), Google OAuth2 (expandable)
- **Role-based access:** Admin and user roles with route protection middleware

### User Management

- **Profile management:** Name, email, avatar (Cloudinary-backed)
- **Account lifecycle:** Registration, email verification, account deletion, reactivation
- **Audit trail:** lastLoginAt, createdAt, updatedAt timestamps
- **Avatar management:** Cloudinary integration for image uploads

### Security Features

- **Brute-force protection:** Account locking after N failed attempts
- **Rate limiting:** Per-route and global request throttling
- **CORS & security headers:** Helmet.js, configurable CORS origins
- **Cookie management:** Secure token storage with httpOnly, sameSite, secure flags
- **Password hashing:** Argon2 password hashing with salt
- **OTP validation:** Time-based, single-use OTP for critical operations

### Email Delivery

- **Nodemailer integration:** SMTP-based email sending
- **EJS templates:** Dynamic email templates (sign-in OTP, password reset)
- **Template rendering:** Secure variable interpolation
- **Gmail/custom SMTP support:** Configurable via environment

### File Uploads

- **Cloudinary integration:** Secure cloud storage for user avatars
- **Multer middleware:** Memory-based file handling before upload
- **File deletion:** Automatic cleanup of old avatars

### Background Jobs

- **Cron-based execution:** node-cron scheduler
- **Job examples:** System monitoring, scheduled tasks
- **Extensible:** Simple job registration pattern for custom tasks
- **Graceful shutdown:** Jobs cleaned up on server termination

### Developer Experience

- **API Documentation:** Swagger/OpenAPI at `/api/docs` (auto-generated)
- **Logging:** Pino logger with pretty-printing in development
- **Validation:** Zod schemas for request/body validation
- **TypeScript:** Strict mode, source maps, full type safety
- **Code quality:** ESLint, Prettier, commitlint, husky pre-commit hooks
- **Path aliases:** `@/` prefix for clean imports (e.g., `@/modules/auth`)

## Technology Stack

| Layer               | Technology                      | Version             |
| ------------------- | ------------------------------- | ------------------- |
| **Runtime**         | Node.js                         | 20+ (ES2022 target) |
| **Framework**       | Express                         | 5.2.1               |
| **Language**        | TypeScript                      | 6.0.2               |
| **Database**        | MongoDB + Mongoose              | 9.3.3               |
| **Cache/Session**   | Redis                           | 5.11.0              |
| **Auth**            | Passport.js + JWT               | 0.7.0               |
| **Hashing**         | Argon2                          | 0.44.0              |
| **Email**           | Nodemailer                      | 8.0.4               |
| **File Storage**    | Cloudinary                      | 2.9.0               |
| **Validation**      | Zod                             | 4.3.6               |
| **Logging**         | Pino                            | 10.3.1              |
| **Scheduling**      | node-cron                       | 4.2.1               |
| **Security**        | Helmet                          | 8.1.0               |
| **Build**           | TypeScript Compiler + tsc-alias | 6.0.2               |
| **Runtime (dev)**   | tsx                             | 4.21.0              |
| **Package Manager** | pnpm                            | latest              |

## API Overview

### Core Routes

```
GET  /                          → Redirect to /api/health
GET  /api/health                → Health check
GET  /api/docs                  → Swagger API documentation
```

### Authentication Routes (`/api/auth`)

```
POST /api/auth/register         → Register new user (email, password, name, role)
POST /api/auth/login            → Initiate login (send OTP to email)
POST /api/auth/verify-otp       → Verify OTP and issue JWT tokens
POST /api/auth/refresh-token    → Rotate refresh token, get new access token
POST /api/auth/logout           → Invalidate tokens (revoke refresh token)
POST /api/auth/forgot-password  → Initiate password reset (send OTP)
POST /api/auth/reset-password   → Reset password via OTP verification
DELETE /api/auth/account        → Delete user account (soft delete)
POST /api/auth/reactivate       → Reactivate deleted account
```

### OAuth Routes (`/api/oauth`)

```
GET  /api/oauth/google/url      → Get Google OAuth2 authorization URL
GET  /api/oauth/google/callback → OAuth2 callback (initiated from frontend)
```

### User Routes (`/api/users`)

```
GET    /api/users/me            → Get authenticated user profile
PATCH  /api/users/me            → Update profile (name, avatar)
DELETE /api/users/me/avatar     → Remove user avatar
GET    /api/users/:id           → Get user by ID (admin only)
DELETE /api/users/:id           → Delete user account (admin only)
```

### Upload Routes (`/api/upload`)

```
POST /api/upload/avatar         → Upload user avatar (returns url, public_id)
```

## Data Models

### User Model

```typescript
{
  _id: ObjectId
  name: String (required, trimmed)
  email: String (required, unique, lowercase)
  password?: String (select: false, for local auth only)
  role: "user" | "admin"
  provider: "local" | "google"
  providerId?: String (for OAuth)
  avatar?: { public_id, url, size }
  isEmailVerified: Boolean
  lastLoginAt?: Date
  failedLoginAttempts: Number
  lockUntil?: Date (account locked until)
  isDeleted: Boolean
  deletedAt?: Date
  reActivateAvailableAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Refresh Token Model

```typescript
{
  _id: ObjectId
  userId: ObjectId (references User)
  tokenHash: String (hashed token for comparison)
  expiresAt: Date
  isRevoked: Boolean
  revokedAt?: Date
  replacedByTokenHash?: String (for rotation detection)
  createdAt: Date
}
```

### OTP Model

```typescript
{
  _id: ObjectId
  email: String
  otpType: "SIGNIN" | "PASSWORD_RESET"
  code: String (hashed)
  expiresAt: Date
  isUsed: Boolean
  usedAt?: Date
  createdAt: Date
}
```

## Environment Configuration

### Required Variables

```bash
# Server
NODE_ENV=development|production
PORT=3000
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info|debug|warn|error

# Database
DATABASE_URL=mongodb://localhost:27017/dbname

# Cache
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-secret-key (min 32 chars)
JWT_REFRESH_SECRET=your-secret-key (min 32 chars)
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password
EMAIL_FROM=noreply@example.com

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OAuth (Google)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
```

## Functional Requirements

| Requirement                   | Status   | Priority |
| ----------------------------- | -------- | -------- |
| User registration with email  | Complete | High     |
| OTP-based login               | Complete | High     |
| JWT token issuance & refresh  | Complete | High     |
| Account lockout (brute-force) | Complete | High     |
| Password hashing (argon2)     | Complete | High     |
| Google OAuth2 integration     | Complete | High     |
| Role-based access control     | Complete | High     |
| User profile management       | Complete | Medium   |
| Avatar upload to Cloudinary   | Complete | Medium   |
| Email notifications           | Complete | Medium   |
| Rate limiting                 | Complete | High     |
| Request validation (Zod)      | Complete | High     |
| Error handling                | Complete | High     |
| API documentation (Swagger)   | Complete | Medium   |
| Background job scheduling     | Complete | Medium   |
| Graceful shutdown             | Complete | High     |

## Non-Functional Requirements

| Requirement         | Implementation                                                                     |
| ------------------- | ---------------------------------------------------------------------------------- |
| **Performance**     | Redis caching, connection pooling, indexing on MongoDB                             |
| **Scalability**     | Stateless design, Redis session store, horizontal scaling ready                    |
| **Security**        | HTTPS-ready, CORS, rate limiting, helmet headers, password hashing, OTP validation |
| **Reliability**     | Error handling, graceful shutdown, transaction support, retry logic                |
| **Maintainability** | TypeScript strict mode, modular structure, comprehensive logging, code standards   |
| **Monitoring**      | Pino logging, system monitor job, health check endpoint                            |
| **Testing**         | Structured for unit/integration tests (framework ready, no tests yet)              |

## Success Metrics

1. **Code Quality:** ESLint/Prettier pass on all commits
2. **Type Safety:** TypeScript strict mode enabled, no implicit any
3. **Security:** All endpoints protected where needed, rate limiting enforced
4. **API Usability:** Swagger docs auto-generated, clear error messages
5. **Developer Experience:** Onboarding time < 30 minutes, CLI commands intuitive
6. **Uptime:** Graceful shutdown, zero data loss on restart

## Architecture Highlights

- **Modular design:** Feature-based modules (auth, user, oauth, upload)
- **Separation of concerns:** Controllers → Services → Models
- **Middleware chain:** Security headers → Rate limiting → Body parsing → Routes → Error handler
- **Type safety:** Zod validation + TypeScript
- **Async/await patterns:** Modern async handling with try-catch
- **Error standardization:** ApiError class with static factory methods
- **Configuration management:** Environment-driven, validation at startup

## Version History

| Version | Date       | Status   | Notes                                           |
| ------- | ---------- | -------- | ----------------------------------------------- |
| 1.0.0   | 2025-04-26 | Complete | Phase 2 - Google OAuth, Redis, Email templating |
| 0.2.0   | 2025-04-03 | Complete | Phase 1.5 - User module, global types           |
| 0.1.0   | 2025-03-xx | Complete | Phase 1 - Core auth, middleware, utilities      |

## Next Steps (Roadmap)

1. **Automated Tests:** Unit tests for services, integration tests for routes
2. **More OAuth Providers:** GitHub, LinkedIn, Microsoft OAuth2
3. **Admin Panel:** User management, role assignment, analytics
4. **Enhanced User CRUD:** Batch operations, advanced filtering
5. **API Versioning:** Support multiple API versions for backward compatibility
6. **GraphQL Alternative:** Parallel GraphQL endpoint
7. **Docker & Kubernetes:** Containerization, k8s deployment configs
8. **Rate Limit Persistence:** Move rate limit data to Redis
9. **Audit Logging:** Track all user actions and admin operations
10. **2FA:** TOTP (Google Authenticator) as second factor
