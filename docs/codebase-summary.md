# Codebase Summary

**Project**: servercn-mongoose-starter v1.0.0  
**Last Updated**: 2026-04-04  
**Total Files**: 19 TypeScript source files  
**Total LOC**: ~850 lines (src/)

## Directory Tree & Line Count

```
src/                                                ~850 LOC
├── server.ts                                      24 LOC
├── app.ts                                         43 LOC
├── routes/
│   └── index.ts                                   12 LOC
├── db/
│   └── db.ts                                      20 LOC
├── modules/
│   ├── auth/
│   │   └── auth.controller.ts                    17 LOC [NEW]
│   ├── health/
│   │   ├── health.controller.ts                  42 LOC
│   │   └── health.routes.ts                      10 LOC
│   └── user/
│       └── user.model.ts                         50 LOC
└── shared/
    ├── configs/
    │   ├── env.ts                                73 LOC
    │   └── swagger.ts                            14 LOC
    ├── constants/
    │   └── status-codes.ts                       31 LOC
    ├── errors/
    │   └── api-error.ts                          73 LOC
    ├── middlewares/
    │   ├── error-handler.ts                      41 LOC
    │   ├── not-found-handler.ts                  10 LOC
    │   └── security-header.ts                    27 LOC [NEW]
    └── utils/
        ├── api-response.ts                       70 LOC
        ├── async-handler.ts                      15 LOC
        ├── logger.ts                             45 LOC
        └── shutdown.ts                           40 LOC
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

**`src/shared/configs/env.ts`** (73 LOC)

Exports:

- **`envSchema`** — Zod object for environment validation
  - **Current**: NODE_ENV, PORT, DATABASE_URL, CORS_ORIGIN, LOG_LEVEL
  - **Future** (commented): JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CRYPTO_SECRET, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI
- **`Env`** — TypeScript type (inferred from Zod)
- **`env`** — Frozen readonly object with validated values
- **Validation**: Exits process if invalid (fail-fast)

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

**`src/shared/utils/shutdown.ts`** (40 LOC)

Exports:

- **`configureGracefulShutdown(server)`** — Handles process termination
  - Listeners: SIGTERM, SIGINT signals
  - Steps:
    1. Log shutdown initiation
    2. Close HTTP server (stops accepting connections)
    3. Close MongoDB connection
    4. Exit process (code 0)
  - Timeout: Force-exit after 10 seconds if not complete
  - Usage: Called in `server.ts` after server starts

## Key Exports Summary

| Module                          | Primary Exports                      | Type                      |
| ------------------------------- | ------------------------------------ | ------------------------- |
| `api-error`                     | `ApiError`                           | Class                     |
| `api-response`                  | `ApiResponse`                        | Class                     |
| `async-handler`                 | `AsyncHandler`, `AsyncRouteHandler`  | Function, Type            |
| `constants/status-codes`        | `STATUS_CODES`, `StatusCode`         | Object, Type              |
| `configs/env`                   | `env`, `Env`, `envSchema`            | Object, Type, Zod schema  |
| `configs/swagger`               | `setupSwagger()`                     | Function                  |
| `middlewares/error-handler`     | `errorHandler()`                     | Function                  |
| `middlewares/not-found-handler` | `notFoundHandler()`                  | Function                  |
| `middlewares/security-header`   | `configureSecurityHeaders()`         | Function                  |
| `logger`                        | `logger`                             | Singleton                 |
| `shutdown`                      | `configureGracefulShutdown()`        | Function                  |
| `modules/auth/controller`       | Auth controller (placeholder)        | Functions                 |
| `modules/health/controller`     | `healthCheck`, `detailedHealthCheck` | Functions                 |
| `modules/health/routes`         | `healthRouter`                       | Express Router            |
| `modules/user/model`            | `User`, `IUser`                      | Mongoose Model, Interface |

## Dependency Graph

```
server.ts
  ├── app.ts
  │   ├── routes/index.ts
  │   │   ├── modules/health/health.routes.ts
  │   │   │   └── modules/health/health.controller.ts
  │   │   │       ├── shared/utils/api-response.ts
  │   │   │       ├── shared/utils/async-handler.ts
  │   │   │       └── shared/constants/status-codes.ts
  │   │   └── (other feature routes)
  │   ├── shared/configs/swagger.ts
  │   ├── shared/middlewares/error-handler.ts
  │   │   ├── shared/errors/api-error.ts
  │   │   ├── shared/utils/api-response.ts
  │   │   └── shared/utils/logger.ts
  │   └── shared/middlewares/not-found-handler.ts
  ├── db/db.ts
  ├── shared/configs/env.ts
  └── shared/utils/shutdown.ts
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

| Metric             | Value                      |
| ------------------ | -------------------------- |
| Total Source Files | 19                         |
| Total LOC (src/)   | ~850                       |
| Largest File       | `api-response.ts` (70 LOC) |
| Smallest File      | `routes/index.ts` (12 LOC) |
| Average File Size  | ~45 LOC                    |
| Modules            | 3 (auth, health, user)     |
| Shared Utilities   | 4                          |
| Shared Middlewares | 3                          |
| Shared Configs     | 2                          |

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
