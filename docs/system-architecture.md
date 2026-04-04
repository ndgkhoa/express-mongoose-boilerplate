# System Architecture

**Project**: servercn-mongoose-starter v1.0.0  
**Last Updated**: 2026-04-04  
**Architecture Style**: Feature-based modular with layered middleware

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Request                             │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  Express Middleware Stack                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Security Headers (Helmet + CORS + Custom Headers)  │ │
│  │ 2. Body Parser (JSON, URL-encoded)                     │ │
│  │ 3. Cookie Parser                                       │ │
│  │ 4. Morgan (HTTP Logging)                               │ │
│  │ 5. Swagger UI Setup                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Route Matching                            │
│                  (*/health, */user, etc.)                    │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Feature Module (Controller)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Validate Request (Zod)                              │ │
│  │ 2. Business Logic (Service layer)                      │ │
│  │ 3. Database Queries (Mongoose)                         │ │
│  │ 4. Response Formatting (ApiResponse)                   │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         ↓
                    Response/Error
                         ↓
    ┌────────────────────┴────────────────────┐
    ↓                                          ↓
  ApiResponse                            ApiError/Exception
    │                                          │
    └────────────────────┬────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│             Global Error Handler Middleware                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Catch all errors (sync & async)                     │ │
│  │ 2. Format as ApiResponse                               │ │
│  │ 3. Log error details                                   │ │
│  │ 4. Set appropriate HTTP status code                    │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   JSON Response                              │
│  {                                                           │
│    "success": boolean,                                       │
│    "message": string,                                        │
│    "statusCode": number,                                     │
│    "data": any,                                              │
│    "errors": any                                             │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Middleware Stack Order

The order is **critical** for correct behavior. Express processes middleware sequentially:

| Order | Middleware                   | Purpose                        | Code Location      |
| ----- | ---------------------------- | ------------------------------ | ------------------ |
| 1     | `configureSecurityHeaders()` | Helmet + CORS + custom headers | security-header.ts |
| 2     | `express.json()`             | Parse JSON bodies              | app.ts             |
| 3     | `express.urlencoded()`       | Parse form data                | app.ts             |
| 4     | `cookieParser()`             | Cookie handling                | app.ts             |
| 5     | `morgan()`                   | HTTP request logging           | app.ts             |
| 6     | `setupSwagger()`             | Swagger UI setup               | app.ts             |
| 7     | Routes                       | Feature routes                 | app.ts             |
| 8     | `notFoundHandler`            | 404 responses                  | app.ts             |
| 9     | `errorHandler`               | Global error handling          | app.ts             |

**Critical**: Security middleware MUST be first. Error handler MUST be last.

## Request Lifecycle

### 1. Request Entry

```
GET /health
  ├── Host validation (CORS)
  ├── Helmet security headers applied
  └── Body parsed (if POST/PUT/PATCH)
```

### 2. Route Matching

```
Route matching via routes/index.ts
  └── health.routes.ts router engaged
      ├── Route: GET /
      ├── Handler: healthCheck (wrapped in AsyncHandler)
      └── Next: Request forwarded to controller
```

### 3. Controller Execution

```
healthCheck controller
  ├── Validate request (if needed)
  ├── Execute business logic
  │   └── Query database (optional)
  ├── Format response (ApiResponse)
  └── Return response or throw ApiError
```

### 4. Success Response

```
ApiResponse.Success(res, message, data, statusCode)
  ├── Instantiate ApiResponse object
  ├── Call .send(res)
  ├── res.status(statusCode).json({...})
  └── HTTP 200/201 response sent
```

### 5. Error Handling

```
throw ApiError.notFound("User not found")
  ├── Caught by AsyncHandler
  ├── Forwarded to errorHandler via next()
  ├── errorHandler identifies ApiError
  ├── Formats as ApiResponse
  ├── Logs error details
  └── Sends HTTP 404 response
```

## Feature Module Architecture

### Module Structure Pattern

Each feature module follows this pattern:

```
modules/{feature}/
├── {feature}.routes.ts      # Express Router definition
├── {feature}.controller.ts  # Request handlers
├── {feature}.model.ts       # Mongoose schema + interface
└── {feature}.service.ts     # Business logic (optional)
```

### Data Flow Within Module

```
HTTP Request
    ↓
{feature}.routes.ts (Router)
    ↓
{feature}.controller.ts (AsyncHandler wrapper)
    ├── Validate input (Zod schema)
    ├── Call service/model methods
    └── Format response (ApiResponse)
    ↓
{feature}.model.ts (Mongoose)
    ├── Schema definition (database structure)
    └── Type interface (TypeScript types)
    ↓
{feature}.service.ts (optional, for complex logic)
    └── Database operations
        Mongoose queries
        Business logic
```

### Example: User Module

```typescript
// routes: Define endpoints
export const userRouter = express.Router();
userRouter.get('/:id', userController.getUser);
userRouter.post('/', userController.createUser);

// controller: Handle requests
export const userController = {
  getUser: AsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('User not found');
    return ApiResponse.ok(res, 'User found', user);
  })
};

// model: Database schema
export interface IUser extends Document {
  email: string;
  name: string;
}

const userSchema = new Schema<IUser>({ ... });
export const User = model<IUser>('User', userSchema);
```

## Error Handling Flow

### Error Propagation

```
Throw Error
    ↓
    ├── Is it in an AsyncHandler?
    │   ├── YES: Promise.catch() → forward to next()
    │   └── NO: Must have try-catch
    ↓
Express Error Handler Middleware
    ├── Check: instanceof ApiError?
    │   ├── YES: Use statusCode, format as ApiResponse
    │   └── NO: Treat as 500 Internal Server Error
    ├── Log error (error level or higher)
    ├── Set response headers (Content-Type: application/json)
    ├── Include stack trace (dev only)
    └── Send JSON response
```

### Error Response Format

**Operational Error (ApiError)**:

```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404,
  "errors": null
}
```

**Validation Error (Zod)**:

```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": {
    "fieldErrors": {
      "email": ["Invalid email format"]
    }
  }
}
```

**Unhandled Error**:

```json
{
  "success": false,
  "message": "Internal Server Error",
  "statusCode": 500,
  "errors": null,
  "stack": "..." // dev only
}
```

## Database Architecture

### Connection Model

```
server.ts startup
    ↓
connectDB() called
    ├── Mongoose.connect(DATABASE_URL)
    ├── Wait for connection
    ├── Attach event listeners
    │   ├── 'connected' → log info
    │   ├── 'disconnected' → log warn
    │   └── 'error' → exit process
    └── Return promise
    ↓
Express server starts listening
    ↓
... request processing ...
    ↓
Process termination (SIGTERM/SIGINT)
    ↓
configureGracefulShutdown()
    ├── Close HTTP server (no new connections)
    ├── Close MongoDB connection
    └── Exit process (code 0)
```

### Mongoose Model Pattern

```typescript
// 1. Define TypeScript interface
export interface IUser extends Document {
  email: string;
  name: string;
  createdAt: Date;
}

// 2. Define Mongoose schema
const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// 3. Create and export model
export const User = model<IUser>("User", userSchema);

// 4. Use in controller
const user = await User.findById(id);
const newUser = await User.create({ email, name });
await User.findByIdAndUpdate(id, updates);
```

## Logging Architecture

### Logger Configuration

```
┌─────────────────────────────────────────┐
│         Pino Logger Instance            │
├─────────────────────────────────────────┤
│ Transport Selection (based on NODE_ENV) │
│                                         │
│ Development:                            │
│ └── pino-pretty (colorized output)      │
│                                         │
│ Production:                             │
│ └── JSON (newline-delimited for parsing)│
└─────────────────────────────────────────┘
        ↓
├── logger.info()     → Normal operations
├── logger.debug()    → Troubleshooting
├── logger.warn()     → Recoverable issues
├── logger.error()    → Handled errors
└── logger.fatal()    → Process termination
```

### Logging Patterns

```typescript
// Startup
logger.info(`Server running at http://localhost:${port}`);

// Business logic
logger.info("User created", { userId: user.id, email: user.email });

// Troubleshooting
logger.debug("Database query", { query, duration: 45 });

// Issues
logger.warn("Slow query detected", { duration: 250 });

// Errors
logger.error(error, "Failed to create user");

// Critical
logger.fatal(error, "Database connection failed");
```

## Environment & Configuration

### Configuration Loading

```
Start Process
    ↓
dotenv-flow loads .env files
    ├── .env (git tracked, defaults)
    ├── .env.local (git ignored, local overrides)
    ├── .env.{NODE_ENV} (environment-specific)
    └── .env.{NODE_ENV}.local (local environment overrides)
    ↓
Zod schema validates all env vars
    ├── Type checks
    ├── Format validation
    ├── Required vs optional
    └── Default values
    ↓
If validation fails:
    ├── Print error details
    └── Exit process (code 1)
    ↓
env object (frozen, readonly)
    └── Type-safe access throughout app
```

### Env Validation in Code

```typescript
// src/shared/configs/env.ts
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment configuration");
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

// Only valid env vars are exported
export const env = Object.freeze(result.data);
```

## Security Architecture

### Security Layers

```
HTTP Request
    ↓
configureSecurityHeaders() [FIRST MIDDLEWARE]
    ↓
Helmet Middleware
├── Content-Security-Policy
├── X-Frame-Options (clickjacking protection)
├── X-Content-Type-Options (MIME sniffing protection)
├── Strict-Transport-Security (HTTPS)
└── Other 14+ security headers
    ↓
CORS Middleware
├── Origin validation (env.CORS_ORIGIN)
├── Allowed methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
├── Allowed headers (Content-Type, Authorization, X-Requested-With)
└── Credentials support (httpOnly cookies)
    ↓
Custom Security Headers
├── X-Content-Type-Options: nosniff
├── X-Frame-Options: DENY
└── X-XSS-Protection: 1; mode=block
    ↓
Cookie Parser
├── Signed cookie support
└── httpOnly flag protection
    ↓
Input Validation (Zod)
├── Type checking
├── Format validation
├── Range validation
└── Custom rules
    ↓
Controller Logic
├── Authorization checks
├── Business logic validation
└── Error handling
```

### CORS Configuration

```typescript
// Configured in configureSecurityHeaders() at security-header.ts
cors({
  origin: env.CORS_ORIGIN || "*", // Single origin or wildcard
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
});
```

## Graceful Shutdown Sequence

```
Process receives SIGTERM/SIGINT
    ↓
Signal Handler Triggered
    ↓
1. Log shutdown initiation
    logger.info('Shutting down gracefully...')
    ↓
2. Close HTTP Server
    server.close()
    ├── No new connections accepted
    ├── Existing connections drain
    └── Keep-Alive connections closed
    ↓
3. Close MongoDB Connection
    mongoose.connection.close()
    ├── Flush pending operations
    └── Release connection pool
    ↓
4. Exit Process
    process.exit(0)
    └── Code 0 = success

    ↓ OR (timeout after 10s) ↓

4b. Force Exit
    process.exit(1)
    └── Code 1 = error
```

## Swagger Documentation Architecture

### Swagger Setup

```
app.ts startup
    ↓
setupSwagger() called (dev only)
    ├── Check NODE_ENV === 'development'
    │   ├── YES: Set up Swagger UI
    │   └── NO: Skip (disabled in production)
    ├── Mount swagger-ui-express at /api/docs
    ├── Load swagger.json from src/docs/
    └── Configure UI options
    ↓
Generate Swagger spec:
    pnpm docs:gen
    ├── Runs swagger.config.ts
    ├── Scans route files for JSDoc comments
    ├── Generates src/docs/swagger.json
    └── Ready for /api/docs endpoint
```

## Component Dependency Tree

```
app.ts (Express setup)
├── routes/index.ts
│   ├── modules/health/health.routes.ts
│   │   └── modules/health/health.controller.ts
│   │       ├── shared/utils/api-response.ts
│   │       ├── shared/utils/async-handler.ts
│   │       └── shared/constants/status-codes.ts
│   └── (other features...)
├── shared/configs/swagger.ts
├── shared/middlewares/error-handler.ts
│   ├── shared/errors/api-error.ts
│   ├── shared/utils/api-response.ts
│   ├── shared/utils/logger.ts
│   └── shared/constants/status-codes.ts
└── shared/middlewares/not-found-handler.ts
    └── shared/errors/api-error.ts

server.ts (Entry point)
├── app.ts (see above)
├── db/db.ts
│   └── shared/utils/logger.ts
├── shared/configs/env.ts
└── shared/utils/shutdown.ts
    └── shared/utils/logger.ts
```

## Performance Characteristics

### Request Lifecycle Timeline

```
Request Entry         ━━━━━━━━━━━━━━━  0ms
Middleware stack      ━━━━━━━  2-5ms
Route matching        ━━━  1-2ms
Controller logic      ━━━━━━━━━━━  10-50ms
  ├── Validation       ━  1-2ms
  ├── DB query         ━━━━━━  5-30ms
  └── Response format  ━  1-2ms
Response sent         ━━━━━━━━━━━━━━━  15-60ms
```

**Total**: <100ms for typical operations

### Memory & Scalability

| Component          | Typical Memory | Scalability             |
| ------------------ | -------------- | ----------------------- |
| Node process       | 50-100MB       | Scales with connections |
| MongoDB connection | 10-20MB        | Connection pooling      |
| Logger buffer      | <1MB           | Minimal                 |
| Middleware stack   | <1MB           | Fixed                   |
| Route cache        | <2MB           | Depends on routes       |

## Related Documentation

- [Project Overview & PDR](./project-overview-pdr.md) — Requirements, roadmap, stack
- [Code Standards](./code-standards.md) — Naming conventions, patterns, best practices
- [Codebase Summary](./codebase-summary.md) — File tree, exports, LOC breakdown
