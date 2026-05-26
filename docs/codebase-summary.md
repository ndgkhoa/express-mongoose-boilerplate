# Codebase Summary

## Directory Structure

```
servercn-express-mongoose/
├── src/
│   ├── app.ts                    # Express app setup (security, middleware, routes)
│   ├── server.ts                 # Server bootstrap (DB, Redis, jobs, graceful shutdown)
│   ├── routes/
│   │   └── index.ts              # Route aggregator → mounts all module routes
│   │
│   ├── types/
│   │   ├── global.d.ts           # Express Request augmentation (user property)
│   │   └── enums/
│   │       ├── index.ts          # Enum exports
│   │       ├── auth-provider.enums.ts     # "local" | "google"
│   │       ├── user-role.enums.ts         # "user" | "admin"
│   │       ├── otp-type.enums.ts          # "SIGNIN" | "PASSWORD_RESET"
│   │       ├── cookie-type.enums.ts       # "ACCESS_TOKEN" | "REFRESH_TOKEN"
│   │       └── account-deletion-type.enums.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts     # Handlers: register, login, logout, etc. (196 LOC)
│   │   │   ├── auth.service.ts        # Business logic: password hashing, OTP verification (333 LOC)
│   │   │   ├── auth.routes.ts         # Route definitions (118 LOC)
│   │   │   ├── auth.validator.ts      # Zod schemas for validation (110 LOC)
│   │   │   └── refresh-token.model.ts # Mongoose model for refresh token storage
│   │   │
│   │   ├── health/
│   │   │   ├── health.controller.ts   # Simple health check response
│   │   │   └── health.routes.ts       # Health endpoint
│   │   │
│   │   ├── oauth/
│   │   │   ├── oauth.controller.ts    # Passport.js strategy callback handlers
│   │   │   ├── oauth.service.ts       # Google OAuth user sync/creation
│   │   │   └── oauth.routes.ts        # OAuth flow endpoints
│   │   │
│   │   ├── otp/
│   │   │   ├── otp.model.ts           # Mongoose OTP schema (sign-in, password reset)
│   │   │   ├── otp.service.ts         # Generate, send, verify OTP (163 LOC)
│   │   │   └── otp.validator.ts       # Zod schema for OTP validation
│   │   │
│   │   ├── upload/
│   │   │   ├── upload.controller.ts   # Handle file upload → Cloudinary
│   │   │   ├── upload.service.ts      # Cloudinary API integration
│   │   │   └── upload.routes.ts       # Upload endpoint
│   │   │
│   │   └── user/
│   │       ├── user.model.ts          # Mongoose User schema (117 LOC)
│   │       └── user.routes.ts         # User CRUD endpoints (profile, avatar)
│   │
│   └── shared/
│       ├── configs/
│       │   ├── env.ts              # Environment variable validation (dotenv-flow)
│       │   ├── db.ts               # MongoDB/Mongoose connection
│       │   ├── redis.ts            # Redis client initialization
│       │   ├── passport.ts         # Passport.js strategy setup (Google OAuth)
│       │   ├── nodemailer.ts       # Email transporter configuration
│       │   ├── cloudinary.ts       # Cloudinary initialization
│       │   └── swagger.ts          # Swagger/OpenAPI auto-generation
│       │
│       ├── constants/
│       │   ├── auth.constants.ts       # LOGIN_MAX_ATTEMPTS, LOCK_TIME_MS, token expiry
│       │   ├── otp.constants.ts        # OTP_EXPIRY, OTP_LENGTH
│       │   └── status-codes.ts         # HTTP status code mappings
│       │
│       ├── errors/
│       │   └── api-error.ts        # Standardized error class (static factories)
│       │
│       ├── helpers/
│       │   ├── auth.helpers.ts         # hashPassword, verifyPassword (argon2)
│       │   ├── cookie.helper.ts        # setAuthCookie, clearAuthCookie
│       │   └── token.helper.ts         # generateHashedToken, verifyToken (87 LOC)
│       │
│       ├── jobs/
│       │   ├── index.ts            # Job scheduler initialization
│       │   ├── example.job.ts       # Template for custom jobs
│       │   └── system-monitor.job.ts # Monitor memory/uptime (cron-based)
│       │
│       ├── middlewares/
│       │   ├── verify-auth.ts           # JWT token validation, user extraction (113 LOC)
│       │   ├── authorize-role.ts        # Role-based access control (admin, user)
│       │   ├── rate-limiter.ts          # express-rate-limit global + per-route (120 LOC)
│       │   ├── validate-request.ts      # Zod schema validation middleware
│       │   ├── validate-id.ts           # MongoDB ObjectId validation
│       │   ├── upload-file.ts           # Multer memory storage for file uploads
│       │   ├── error-handler.ts         # Global error handler (ApiError → JSON response)
│       │   ├── not-found-handler.ts     # 404 response
│       │   ├── security-header.ts       # Helmet integration
│       │   └── user-account-restriction.ts # Check if user deleted/locked
│       │
│       └── utils/
│           ├── api-response.ts      # ApiResponse class (Success, created, send)
│           ├── async-handler.ts     # Express async error wrapper
│           ├── jwt.ts               # generateAccessToken, verifyAccessToken, etc.
│           ├── logger.ts            # Pino logger instance
│           ├── render-template.ts   # EJS template rendering
│           ├── send-mail.ts         # Nodemailer wrapper
│           └── shutdown.ts          # Graceful shutdown logic (DB, Redis cleanup)
│
├── package.json                 # Dependencies, scripts, lint-staged config
├── tsconfig.json               # TypeScript config (strict mode, @/ alias)
├── swagger.config.ts           # Swagger auto-generation script
├── commitlint.config.ts        # Commit message validation
├── .env.example                # Environment template
└── dist/                       # Compiled JavaScript (gitignored)
```

## Module Descriptions

### Auth Module

**Responsibility:** User registration, login (OTP-based), token management, password reset, account deletion.

**Key Files:**

- `auth.service.ts` (333 LOC): registerUser, loginAndSendOtp, verifyOtp, refreshAccessToken, logout, changePassword, deleteAccount, reactivateAccount
- `auth.controller.ts` (196 LOC): Request handlers wrapping service methods
- `auth.routes.ts` (118 LOC): POST/DELETE routes for auth operations
- `auth.validator.ts` (110 LOC): Zod schemas for signup, login, OTP verification, password reset
- `refresh-token.model.ts`: Mongoose model for token rotation tracking

**Data Flow:** Client → Controller → Validator → Service → Models (User, RefreshToken, OTP) → Response

### Health Module

**Responsibility:** Health check endpoint for monitoring.

**Key Files:**

- `health.controller.ts`: Returns server status, dependencies (DB, Redis)
- `health.routes.ts`: GET endpoint

### OAuth Module

**Responsibility:** Google OAuth2 authentication flow.

**Key Files:**

- `oauth.service.ts`: Find or create user from Google profile
- `oauth.controller.ts`: Passport.js callback handler
- `oauth.routes.ts`: Authorization URL endpoint, callback handler

**Flow:** Frontend → GET /oauth/google/url → Google authorization → Callback → User creation/sync → JWT tokens

### OTP Module

**Responsibility:** Generate, send, and verify one-time passwords for sign-in and password reset.

**Key Files:**

- `otp.service.ts` (163 LOC): generateOtp, sendOtp, verifyOtp
- `otp.model.ts`: Mongoose OTP schema
- `otp.validator.ts`: Zod schemas

**Email Flow:** Service → EJS template rendering → Nodemailer → SMTP

### Upload Module

**Responsibility:** File upload to Cloudinary.

**Key Files:**

- `upload.service.ts`: uploadFile, deleteFile (Cloudinary API calls)
- `upload.controller.ts`: Request handler
- `upload.routes.ts`: POST endpoint with multer middleware

### User Module

**Responsibility:** User profile retrieval and updates.

**Key Files:**

- `user.model.ts` (117 LOC): Mongoose User schema with indexes
- `user.routes.ts`: GET profile, PATCH profile, DELETE avatar endpoints

## Middleware Chain

Execution order (top to bottom):

1. **Security Headers** → Helmet.js (HSTS, X-Frame-Options, etc.)
2. **Rate Limiting** → Global & per-route throttling
3. **JSON/URL Parser** → Body parsing
4. **Cookie Parser** → Cookie extraction
5. **Morgan** → HTTP request logging
6. **Swagger** → API documentation setup
7. **Routes** → Request routing (security, validation, business logic)
8. **Not Found Handler** → 404 response
9. **Global Error Handler** → Catches all errors, formats response

## Key Patterns

### Error Handling

```typescript
// Custom ApiError with static factory methods
throw ApiError.badRequest("Invalid input");
throw ApiError.unauthorized("Token expired");
throw ApiError.conflict("Email already exists");

// Global handler catches and formats as JSON
{ success: false, message: "...", statusCode: 400 }
```

### Request Validation

```typescript
// Zod schema + middleware wrapper
const signupSchema = z.object({ email, password, name, role });
router.post("/register", validateRequest(signupSchema), controller);
```

### Async Error Handling

```typescript
// asyncHandler wraps controller methods
const handler = asyncHandler(async (req, res) => {
  // Errors caught automatically → passed to global error handler
});
```

### API Response

```typescript
// Standardized response class
ApiResponse.ok(res, "Success", data); // 200 OK
ApiResponse.created(res, "Created", data); // 201 Created
```

### Token Lifecycle

```
1. Login: Hash password → Verify → Send OTP
2. Verify OTP: Generate Access + Refresh tokens
3. Refresh: Validate old refresh token → Issue new pair → Revoke old refresh token
4. Logout: Mark refresh token as revoked
```

### File Organization Best Practices

- **Kebab-case files:** `verify-auth.ts`, `rate-limiter.ts`
- **Feature modules:** Self-contained with controller, service, routes, validator
- **Shared utilities:** No business logic, pure utility functions
- **Single responsibility:** Each file has one clear purpose

## Type Safety

- **Global Express Request:** User property augmented in `types/global.d.ts`
- **Enum types:** Separate enum files with constant exports
- **Model interfaces:** IUser, IAvatar, etc. defined in models
- **Service types:** SessionContext for session management

## Configuration Management

**Environment Variables:**

- Loaded via `dotenv-flow` (supports `.env`, `.env.local`, `.env.development`)
- Validated at startup via Zod schema in `configs/env.ts`
- App exits if required vars missing

**Database:**

- MongoDB connection pooling via Mongoose
- Graceful disconnect on server shutdown

**Redis:**

- Used for token/session storage
- Configurable via REDIS_URL
- Graceful disconnect on server shutdown

## External Integrations

| Service      | Library            | Purpose                         |
| ------------ | ------------------ | ------------------------------- |
| Email        | Nodemailer         | Send OTP, password reset emails |
| File Storage | Cloudinary         | Avatar uploads & storage        |
| OAuth        | Passport.js        | Google OAuth2 flow              |
| Caching      | Redis              | Session/token storage           |
| Database     | MongoDB + Mongoose | Data persistence                |

## Key Code Metrics

| File               | LOC | Purpose                  |
| ------------------ | --- | ------------------------ |
| auth.service.ts    | 333 | Core auth business logic |
| auth.controller.ts | 196 | Auth route handlers      |
| user.model.ts      | 117 | User schema & validation |
| auth.routes.ts     | 118 | Auth endpoints           |
| verify-auth.ts     | 113 | JWT middleware           |
| auth.validator.ts  | 110 | Zod validation schemas   |
| rate-limiter.ts    | 120 | Rate limiting config     |
| token.helper.ts    | 87  | Token utilities          |
| otp.service.ts     | 163 | OTP logic                |

## Development Workflow

```bash
# Start development
npm run dev           # tsx with watch mode

# Build for production
npm run build         # tsc + tsc-alias

# Production runtime
npm start             # node dist/server.js

# Code quality
npm run lint:fix      # ESLint auto-fix
npm run format:fix    # Prettier format
npm run typecheck     # Type checking

# Docs generation
npm run docs:gen      # Swagger docs generation
```

## Compilation & Path Resolution

- **Compiler:** TypeScript 6.0.2 (ES2021 target, ES2022 module)
- **Path aliases:** `@/*` → `./src/*` (resolved at build time via tsc-alias)
- **Source maps:** Enabled for debugging
- **Output:** `dist/` directory with `.js` and `.d.ts` files

## Performance Optimizations

1. **Connection Pooling:** Mongoose and Redis maintain pools
2. **Indexing:** MongoDB indexes on email, provider, role, isDeleted
3. **Selective Fields:** Password marked `select: false` (loaded only when needed)
4. **Rate Limiting:** Prevents abuse, reduces CPU load
5. **Redis Caching:** Token/session storage (faster than DB queries)
6. **Graceful Shutdown:** Allows in-flight requests to complete

## Security Considerations

1. **Password Hashing:** Argon2 (slow, memory-hard algorithm)
2. **Token Storage:** Hashed before database storage, validation via hash comparison
3. **OTP Validation:** Single-use, time-limited (configurable expiry)
4. **Account Lockout:** After N failed attempts, locked for M minutes
5. **CORS:** Configurable allowed origins
6. **Rate Limiting:** Per-IP throttling
7. **HTTPS Headers:** Helmet.js security headers
8. **JWT Secrets:** Must be 32+ characters (env validated)
