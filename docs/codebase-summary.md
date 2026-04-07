# Codebase Summary

**Project**: servercn-mongoose-starter v1.1.0  
**Last Updated**: 2026-04-07  
**Total Files**: 26 TypeScript + EJS source files  
**Total LOC**: ~1,200 lines (src/ + templates/)

## Directory Tree & Line Count

```
src/                                                ~1,050 LOC
├── server.ts                                      35 LOC (waits for DB + Redis)
├── app.ts                                         50 LOC (includes Passport)
├── routes/
│   └── index.ts                                   18 LOC (includes OAuth routes)
├── db/
│   └── db.ts                                      25 LOC (with try-catch)
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts                    18 LOC
│   │   ├── auth.service.ts                       60 LOC (handleToken exported)
│   │   └── auth.routes.ts                        12 LOC
│   ├── oauth/                                     [NEW]
│   │   ├── oauth.controller.ts                   25 LOC (Google callback)
│   │   ├── oauth.service.ts                      35 LOC (handleOAuthLogin)
│   │   └── oauth.routes.ts                       12 LOC
│   ├── otp/                                       [NEW]
│   │   ├── otp.service.ts                        40 LOC (uses EJS template)
│   │   └── otp.model.ts                          30 LOC
│   ├── health/
│   │   ├── health.controller.ts                  42 LOC
│   │   └── health.routes.ts                      10 LOC
│   └── user/
│       ├── user.routes.ts                        15 LOC
│       ├── user.controller.ts                    20 LOC
│       ├── user.model.ts                         55 LOC
│       └── user.service.ts                       25 LOC
├── templates/                                    [NEW]
│   └── signin-otp.ejs                            12 LOC
└── shared/
    ├── configs/
    │   ├── env.ts                                95 LOC (new: REDIS_URL, GOOGLE_*)
    │   ├── passport.ts                           20 LOC [NEW]
    │   ├── redis.ts                              35 LOC [NEW]
    │   └── swagger.ts                            14 LOC
    ├── constants/
    │   └── status-codes.ts                       31 LOC
    ├── errors/
    │   └── api-error.ts                          73 LOC
    ├── middlewares/
    │   ├── error-handler.ts                      41 LOC
    │   ├── not-found-handler.ts                  10 LOC
    │   └── security-header.ts                    27 LOC
    └── utils/
        ├── api-response.ts                       70 LOC
        ├── async-handler.ts                      15 LOC
        ├── logger.ts                             45 LOC
        ├── render-template.ts                    20 LOC [NEW]
        ├── send-mail.ts                          35 LOC (uses templates)
        └── shutdown.ts                           50 LOC (includes Redis)
```

## Module Descriptions

### Entry Point

**`src/server.ts`** (24 LOC)

- Connects to MongoDB via `connectDB()`
- Starts Express server listening on `env.PORT`
- Configures graceful shutdown handler
- Logs startup information (port, environment, Swagger docs URL)

**`src/app.ts`** (43 LOC)

- Express app initialization with middleware stack
- Security headers middleware applied FIRST (Helmet + CORS + custom headers)
- Body parser, cookie parser, Morgan setup
- Swagger documentation configuration
- Route registration
- Not-found and error handler middleware

### Database Layer

**`src/db/db.ts`** (20 LOC)

- Mongoose connection to `env.DATABASE_URL`
- Connection event handlers (connect, disconnect, error)
- Exported `connectDB()` function for server initialization

### Routes

**`src/routes/index.ts`** (12 LOC)

- Express Router aggregator
- Imports feature routes: health, user, etc.

### Auth Feature Module

**`src/modules/auth/auth.controller.ts`** (17 LOC) [NEW]

Exports:

- Placeholder controller for future authentication endpoints
- Foundation for JWT, OAuth, and password-based authentication patterns

### Health Feature Module

**`src/modules/health/health.controller.ts`** (42 LOC)

Exports:

- **`healthCheck()`** — Basic health endpoint
  - Response: `{ status, timestamp, uptime }`
  - Wrapped with `AsyncHandler`
- **`detailedHealthCheck()`** — Detailed health with system info
  - Response: `{ status, timestamp, uptime, environment, version, memory, cpu }`
  - Wrapped with `AsyncHandler`

**`src/modules/health/health.routes.ts`** (10 LOC)

Exports:

- **`healthRouter`** — Express Router
  - `GET /health` → `healthCheck`
  - `GET /health/detailed` → `detailedHealthCheck`

### User Feature Module

**`src/modules/user/user.model.ts`** (50 LOC)

Exports:

- **`IUser`** — TypeScript interface extending Mongoose Document
  - `_id: ObjectId`
  - `name: string` (required)
  - `email: string` (unique, required)
  - `password: string | null` (optional for OAuth)
  - `role: 'user' | 'admin'` (required)
  - `isEmailVerified: boolean` (required)
  - `createdAt: Date` (auto-set)
  - `updatedAt: Date` (auto-update)
- **`User`** — Mongoose model for IUser with OAuth support

### Shared Configs

**`src/shared/configs/env.ts`** (95 LOC)

Exports:

- **`envSchema`** — Zod object for environment validation
  - **Current**: NODE_ENV, PORT, DATABASE_URL, CORS_ORIGIN, LOG_LEVEL
  - **Phase 2**: REDIS_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
  - **Future** (commented): JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SMTP_HOST, etc.
- **`Env`** — TypeScript type (inferred from Zod)
- **`env`** — Frozen readonly object with validated values
- **Validation**: Exits process if invalid (fail-fast)

**`src/shared/configs/redis.ts`** (35 LOC) [NEW]

Exports:

- **`redisClient`** — Redis client singleton
- **`setCache(key, value, ttl)`** — Store value with optional TTL (seconds)
- **`getCache(key)`** — Retrieve cached value (generic type support)
- **`deleteCache(key)`** — Remove cache entry
- **Initialization**: Connects on server startup; disconnected on graceful shutdown

**`src/shared/configs/passport.ts`** (20 LOC) [NEW]

Exports:

- **`googleOAuth`** — Passport Google OAuth 2.0 strategy
  - Uses `env.GOOGLE_CLIENT_ID`, `env.GOOGLE_CLIENT_SECRET`, `env.GOOGLE_REDIRECT_URI`
  - Callback: `modules/oauth/oauth.controller.googleOAuth`
  - Profile: Extracts `id`, `email`, `name`, `picture`

**`src/shared/configs/swagger.ts`** (14 LOC)

Exports:

- **`setupSwagger()`** — Configures Swagger UI
  - Serves `/docs` (dev only)
  - Auto-loads `src/docs/swagger.json`
  - Uses swagger-ui-express

### Shared Constants

**`src/shared/constants/status-codes.ts`** (31 LOC)

Exports:

- **`STATUS_CODES`** — Object with HTTP status code constants
  - OK: 200, CREATED: 201, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, NOT_IMPLEMENTED: 501, BAD_GATEWAY: 502, SERVICE_UNAVAILABLE: 503, TOO_MANY_REQUESTS: 429, INTERNAL_SERVER_ERROR: 500
- **`StatusCode`** — TypeScript type (union of status code values)

### Shared Errors

**`src/shared/errors/api-error.ts`** (73 LOC)

Exports:

- **`ApiError`** — Custom error class extending Error
  - Properties:
    - `statusCode: StatusCode`
    - `isOperational: boolean`
    - `errors?: unknown`
  - Constructor: `(statusCode, message, errors?, isOperational=true)`
  - Factory methods:
    - `badRequest(message?, errors?)` → 400
    - `unauthorized(message?)` → 401
    - `forbidden(message?)` → 403
    - `notFound(message?)` → 404
    - `conflict(message?)` → 409
    - `validation(message?, errors?)` → 400
    - `notImplemented(message?)` → 501
    - `badGateway(message?)` → 502
    - `serviceUnavailable(message?)` → 503
    - `tooManyRequests(message?)` → 429
    - `server(message?)` → 500
  - Stack trace captured via `Error.captureStackTrace()`

### Shared Middlewares

**`src/shared/middlewares/error-handler.ts`** (41 LOC)

Exports:

- **`errorHandler()`** — Express error handler middleware
  - Signature: `(err, req, res, next) => void`
  - Handles `ApiError` instances specifically
  - Returns consistent `ApiResponse` format
  - Logs errors at appropriate levels
  - Returns 500 for unhandled errors
  - Includes stack trace in dev environment
  - Must be last middleware in chain

**`src/shared/middlewares/not-found-handler.ts`** (10 LOC)

Exports:

- **`notFoundHandler()`** — 404 handler for unmapped routes
  - Signature: `(req, res) => void`
  - Throws `ApiError.notFound('Resource not found')`
  - Caught by global error handler
  - Must be after all route definitions

**`src/shared/middlewares/security-header.ts`** (27 LOC) [NEW]

Exports:

- **`configureSecurityHeaders(app)`** — Security middleware factory
  - Helmet middleware (14+ security headers)
  - CORS with configurable origin and credentials
  - Custom headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
  - Applied as FIRST middleware in app.ts

### Shared Utils

**`src/shared/utils/api-response.ts`** (70 LOC)

Exports:

- **`ApiResponse<T>`** — Generic response class
  - Properties: `success`, `message`, `statusCode`, `data?`, `errors?`
  - Method: `send(res)` → sends JSON response
  - Static methods:
    - `Success<T>(res, message, data?, statusCode?)` → Response
    - `ok<T>(res, message?, data?)` → calls Success with 200
    - `created<T>(res, message?, data?)` → calls Success with 201
- **`ApiResponseParams<T>`** — Type for response construction

**`src/shared/utils/async-handler.ts`** (15 LOC)

Exports:

- **`AsyncRouteHandler`** — Type alias for async route function
  - Signature: `(req, res, next) => Promise<unknown>`
- **`AsyncHandler(fn)`** — Higher-order function
  - Wraps async route handler
  - Catches Promise rejections
  - Forwards errors to Express error handler via `next()`
  - Usage: `AsyncHandler(async (req, res) => { ... })`

**`src/shared/utils/logger.ts`** (45 LOC)

Exports:

- **`logger`** — Pino logger instance (singleton)
  - Transport: `pino-pretty` (dev), JSON (prod)
  - Methods: `info()`, `debug()`, `warn()`, `error()`, `fatal()`
  - Configuration: Level from `env.LOG_LEVEL`
  - Colors: Enabled in development, disabled in production

**`src/shared/utils/render-template.ts`** (20 LOC) [NEW]

Exports:

- **`renderTemplate(templateName, data)`** — EJS template renderer
  - Resolves template from `src/templates/{templateName}.ejs`
  - Renders with provided data (variables, loops, conditionals)
  - Returns Promise\<string\> (HTML)
  - Usage: `renderTemplate("signin-otp", { name, code })`

**`src/shared/utils/send-mail.ts`** (35 LOC) [UPDATED]

Exports:

- **`sendEmail(options)`** — Nodemailer email sender
  - Parameters: `{ to, subject, html, templateName?, data? }`
  - Uses `renderTemplate()` if `templateName` + `data` provided
  - Renders dynamic emails via EJS
  - Returns Promise\<void\>

**`src/shared/utils/shutdown.ts`** (50 LOC) [UPDATED]

Exports:

- **`configureGracefulShutdown(server)`** — Handles process termination
  - Listeners: SIGTERM, SIGINT signals
  - Steps:
    1. Log shutdown initiation
    2. Close HTTP server (stops accepting connections)
    3. Close MongoDB connection
    4. Close Redis connection (if initialized)
    5. Exit process (code 0)
  - Timeout: Force-exit after 10 seconds if not complete
  - Usage: Called in `server.ts` after server starts

## Key Exports Summary

| Module                          | Primary Exports                                      | Type                      |
| ------------------------------- | ---------------------------------------------------- | ------------------------- |
| `api-error`                     | `ApiError`                                           | Class                     |
| `api-response`                  | `ApiResponse`                                        | Class                     |
| `async-handler`                 | `AsyncHandler`, `AsyncRouteHandler`                  | Function, Type            |
| `constants/status-codes`        | `STATUS_CODES`, `StatusCode`                         | Object, Type              |
| `configs/env`                   | `env`, `Env`, `envSchema`                            | Object, Type, Zod schema  |
| `configs/redis`                 | `redisClient`, `setCache`, `getCache`, `deleteCache` | Singleton, Functions      |
| `configs/passport`              | `googleOAuth`                                        | Passport Strategy         |
| `configs/swagger`               | `setupSwagger()`                                     | Function                  |
| `middlewares/error-handler`     | `errorHandler()`                                     | Function                  |
| `middlewares/not-found-handler` | `notFoundHandler()`                                  | Function                  |
| `middlewares/security-header`   | `configureSecurityHeaders()`                         | Function                  |
| `utils/logger`                  | `logger`                                             | Singleton                 |
| `utils/render-template`         | `renderTemplate()`                                   | Function                  |
| `utils/send-mail`               | `sendEmail()`                                        | Function                  |
| `utils/shutdown`                | `configureGracefulShutdown()`                        | Function                  |
| `modules/auth/controller`       | Auth controller functions                            | Functions                 |
| `modules/auth/service`          | `handleToken()` (exported for OAuth reuse)           | Function                  |
| `modules/oauth/controller`      | `googleOAuth`                                        | Function                  |
| `modules/oauth/service`         | `handleOAuthLogin()`                                 | Function                  |
| `modules/otp/service`           | `sendOtp()`, `verifyOtp()`                           | Functions                 |
| `modules/health/controller`     | `healthCheck`, `detailedHealthCheck`                 | Functions                 |
| `modules/health/routes`         | `healthRouter`                                       | Express Router            |
| `modules/user/model`            | `User`, `IUser`                                      | Mongoose Model, Interface |
| `modules/user/service`          | User service functions                               | Functions                 |

## Dependency Graph

```
server.ts
  ├── app.ts
  │   ├── routes/index.ts
  │   │   ├── modules/health/health.routes.ts
  │   │   ├── modules/oauth/oauth.routes.ts (NEW)
  │   │   │   └── modules/oauth/oauth.controller.ts
  │   │   ├── modules/auth/auth.routes.ts
  │   │   │   └── modules/auth/auth.controller.ts
  │   │   └── (other feature routes)
  │   ├── shared/configs/passport.ts (NEW)
  │   ├── shared/configs/swagger.ts
  │   ├── shared/middlewares/error-handler.ts
  │   │   ├── shared/errors/api-error.ts
  │   │   ├── shared/utils/api-response.ts
  │   │   └── shared/utils/logger.ts
  │   └── shared/middlewares/not-found-handler.ts
  ├── db/db.ts
  ├── shared/configs/env.ts
  ├── shared/configs/redis.ts (NEW)
  ├── shared/utils/render-template.ts (NEW)
  │   └── src/templates/signin-otp.ejs
  ├── shared/utils/send-mail.ts (UPDATED)
  │   └── shared/utils/render-template.ts
  └── shared/utils/shutdown.ts (UPDATED)
      ├── shared/configs/redis.ts
      └── shared/utils/logger.ts
```

## Data Flow

```
HTTP Request
    ↓
Security Headers (Helmet + CORS + Custom Headers) [FIRST]
    ↓
Body Parser + Cookie Parser
    ↓
Morgan Logging
    ↓
Routes (health, auth, user, etc.)
    ├→ Feature Module Routes (AsyncHandler)
    │   └→ Controller (validate, business logic)
    │       └→ ApiResponse (success/created)
    │
    └→ Not Found Handler (throws ApiError)
    ↓
Global Error Handler
    └→ ApiError → format response
    └→ Other errors → 500 response
    ↓
HTTP Response
```

## Code Metrics

| Metric                | Value                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| Total Source Files    | 26 (TS + EJS)                                                                 |
| Total LOC (src/)      | ~1,050 (TypeScript)                                                           |
| Total LOC (templates) | ~12 (EJS)                                                                     |
| Largest File          | `auth.service.ts` (60 LOC)                                                    |
| Smallest File         | `health.routes.ts` (10 LOC)                                                   |
| Average File Size     | ~45 LOC                                                                       |
| Modules               | 5 (auth, oauth, otp, health, user)                                            |
| Shared Utilities      | 6 (logger, api-response, async-handler, render-template, send-mail, shutdown) |
| Shared Middlewares    | 3                                                                             |
| Shared Configs        | 4 (env, redis, passport, swagger)                                             |
| Email Templates       | 1 (signin-otp.ejs)                                                            |

## TypeScript Configuration

| Setting          | Value                                       |
| ---------------- | ------------------------------------------- |
| Target           | ES2021                                      |
| Module           | es2022                                      |
| Strict Mode      | Enabled (all flags)                         |
| Path Alias       | `@/*` → `src/*` (replaces relative imports) |
| Emit Source Maps | Yes                                         |
| Remove Comments  | Yes                                         |

## Performance Characteristics

| Operation         | Expected Time | Details                   |
| ----------------- | ------------- | ------------------------- |
| Server startup    | 1-2s          | DB connect + listen       |
| Health check      | <10ms         | In-memory calculation     |
| Graceful shutdown | 3-5s          | Close server + DB         |
| API response      | <100ms        | Depends on business logic |

## Related Documentation

- [Project Overview & PDR](./project-overview-pdr.md) — Features, roadmap, architecture
- [Code Standards](./code-standards.md) — Naming conventions, patterns
- [System Architecture](./system-architecture.md) — Request lifecycle, error flow
