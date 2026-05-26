# System Architecture

## High-Level Overview

Express-Mongoose-Boilerplate is a three-tier REST API architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Clients (Frontend)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
    ┌───▼────────┐                   ┌───▼────────┐
    │  Browser   │                   │  Mobile    │
    │  API Calls │                   │  App       │
    └───┬────────┘                   └───┬────────┘
        │                                 │
        └────────────────┬────────────────┘
                         │ HTTP/HTTPS
        ┌────────────────▼────────────────────┐
        │   Express Server (Port 3000)         │
        │  ┌──────────────────────────────┐   │
        │  │  Middleware Layer            │   │
        │  │ - Security Headers (Helmet)  │   │
        │  │ - Rate Limiting              │   │
        │  │ - Body Parsing               │   │
        │  │ - Request Validation (Zod)   │   │
        │  │ - Authentication/Authorization│  │
        │  └──────────────────────────────┘   │
        │  ┌──────────────────────────────┐   │
        │  │  Route Layer                 │   │
        │  │ - /api/auth (auth logic)     │   │
        │  │ - /api/oauth (OAuth2)        │   │
        │  │ - /api/users (profiles)      │   │
        │  │ - /api/upload (files)        │   │
        │  │ - /api/health (monitoring)   │   │
        │  └──────────────────────────────┘   │
        │  ┌──────────────────────────────┐   │
        │  │  Service Layer               │   │
        │  │ - Auth Service               │   │
        │  │ - OTP Service                │   │
        │  │ - Upload Service             │   │
        │  └──────────────────────────────┘   │
        └─────┬──┬──────────┬─────────┬───────┘
              │  │          │         │
    ┌─────────▼─┐│   ┌──────▼──┐  ┌──▼──────────┐
    │ MongoDB   ││   │  Redis   │  │  Background│
    │ (Data)    ││   │ (Session)│  │  Jobs      │
    │           ││   │          │  │ (Cron)     │
    └───────────┘│   └──────────┘  └────────────┘
      │ External  │
      │ Services  │
    ┌─▼────────┐ ┌▼──────────┐ ┌──────────┐
    │Cloudinary│ │ Nodemailer│ │Passport  │
    │(Files)   │ │(Email)    │ │(OAuth2)  │
    └──────────┘ └───────────┘ └──────────┘
```

## Request Lifecycle

### 1. HTTP Request Arrives

```
Client HTTP Request
        ↓
Express Router (port 3000)
```

### 2. Security & Middleware Chain

```
1. Security Headers (Helmet)
   ├─ X-Frame-Options
   ├─ X-Content-Type-Options
   ├─ Strict-Transport-Security
   └─ etc.

2. Rate Limiting
   ├─ Global throttle (100 req/15 min per IP)
   └─ Per-route overrides (stricter for auth)

3. Body Parsing
   ├─ express.json() → Parse JSON
   ├─ express.urlencoded() → Parse form data
   └─ cookieParser() → Extract cookies

4. Morgan Logging
   └─ Log request: method, path, status, response time

5. Route Matching
   └─ Find matching route handler

6. Authentication (if required)
   ├─ Extract token from Authorization header or cookie
   ├─ Verify JWT signature
   ├─ Extract user data (userId, role)
   └─ Attach to req.user

7. Authorization (if required)
   ├─ Check user role matches route requirements
   └─ Or deny access
```

### 3. Controller (Request Handler)

```
Controller
├─ Extract request data (body, params, query)
├─ Call service method
├─ Format response
└─ Send response (via ApiResponse)
```

### 4. Service (Business Logic)

```
Service
├─ Validate data
├─ Query database (Mongoose)
├─ Call external services (Cloudinary, email)
├─ Apply business rules
├─ Throw ApiError if validation/logic fails
└─ Return result to controller
```

### 5. Model (Data Layer)

```
Mongoose Model
├─ Query MongoDB
├─ Apply schema validation
├─ Return typed data (IUser, etc.)
└─ Or throw Mongoose errors (caught as ApiError)
```

### 6. Response

```
If Success:
  ApiResponse.ok(res, "Success", data)
  → HTTP 200 with JSON

If Error:
  Caught by global error handler
  → ApiResponse with statusCode and message
  → HTTP 4xx/5xx with JSON
```

## Authentication Flow

### Local Authentication (Email/Password)

```
1. User Registration
   ┌─────────────┐
   │ POST /register
   │ {email, password, name, role}
   └─────────────┘
           ↓
   ┌─────────────┐
   │ Service: registerUser
   │ ├─ Check email not exists
   │ ├─ Hash password (argon2)
   │ └─ Create user in MongoDB
   └─────────────┘
           ↓
   ┌─────────────┐
   │ Return: User object (200 Created)
   └─────────────┘

2. User Login & OTP Generation
   ┌─────────────┐
   │ POST /login
   │ {email, password}
   └─────────────┘
           ↓
   ┌─────────────┐
   │ Service: loginAndSendOtp
   │ ├─ Find user by email
   │ ├─ Verify password (argon2)
   │ ├─ Check account not locked
   │ ├─ Track failed attempts
   │ ├─ Generate OTP
   │ ├─ Render EJS email template
   │ └─ Send email via Nodemailer
   └─────────────┘
           ↓
   ┌─────────────┐
   │ Return: { message: "OTP sent to email" } (200 OK)
   └─────────────┘

3. OTP Verification & Token Issuance
   ┌─────────────┐
   │ POST /verify-otp
   │ {email, code}
   └─────────────┘
           ↓
   ┌─────────────┐
   │ Service: verifyOtpAndLogin
   │ ├─ Find OTP by email & code
   │ ├─ Check OTP not expired
   │ ├─ Check OTP not used
   │ ├─ Mark OTP as used
   │ ├─ Reset failed login attempts
   │ ├─ Generate JWT access token (1h)
   │ ├─ Generate refresh token
   │ ├─ Hash & store refresh token in DB
   │ ├─ Set secure cookies
   │ └─ Update lastLoginAt
   └─────────────┘
           ↓
   ┌─────────────┐
   │ Return: { accessToken, refreshToken, user } (200 OK)
   │ Cookies: accessToken (httpOnly), refreshToken (httpOnly)
   └─────────────┘
```

### Token Refresh Flow

```
Client Token Expired
        ↓
┌─────────────────────────┐
│ POST /refresh-token
│ { refreshToken }
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Service: refreshAccessToken
│ ├─ Verify refresh token signature
│ ├─ Find stored refresh token
│ ├─ Check not revoked
│ ├─ Check not expired
│ ├─ Detect reuse (security check)
│ ├─ Generate new access token
│ ├─ Generate new refresh token
│ ├─ Revoke old refresh token
│ ├─ Mark new as replacement
│ └─ Update cookies
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│ Return: { accessToken, refreshToken } (200 OK)
└─────────────────────────┘
```

### Google OAuth2 Flow

```
1. Frontend requests authorization URL
   ┌─────────────────────────┐
   │ GET /oauth/google/url
   └─────────────────────────┘
           ↓
   ┌─────────────────────────┐
   │ Return: Google auth URL
   │ (redirect_uri set to callback endpoint)
   └─────────────────────────┘

2. User authorizes in Google consent screen
   └─ User redirected to: /oauth/google/callback?code=...

3. Backend exchanges code for tokens
   ┌─────────────────────────┐
   │ GET /oauth/google/callback?code=xxx
   └─────────────────────────┘
           ↓
   ┌─────────────────────────┐
   │ Passport.js GoogleStrategy
   │ ├─ Exchange code for tokens
   │ ├─ Fetch user profile
   │ └─ Verify signature
   └─────────────────────────┘
           ↓
   ┌─────────────────────────┐
   │ Service: syncGoogleUser
   │ ├─ Find user by provider+providerId
   │ ├─ If exists: update avatar & email
   │ ├─ If not exists: create new user
   │ ├─ Generate JWT tokens
   │ └─ Set cookies
   └─────────────────────────┘
           ↓
   ┌─────────────────────────┐
   │ Redirect to frontend with tokens
   │ (or set in response body)
   └─────────────────────────┘
```

## OTP System

### OTP Generation & Delivery

```
Service: sendOtp
├─ Generate 6-digit code
├─ Set expiry (5-10 minutes)
├─ Store in MongoDB (hashed)
└─ Send via email
    ├─ Render EJS template (signin-otp.ejs)
    ├─ Replace variables ({{ otp_code }}, etc.)
    └─ Send via Nodemailer SMTP

MongoDB OTP Document:
{
  _id: ObjectId,
  email: "user@example.com",
  otpType: "SIGNIN",      // or "PASSWORD_RESET"
  code: "hashed_123456",
  expiresAt: Date,
  isUsed: false,
  usedAt: null,
  createdAt: Date
}
```

### OTP Verification

```
Service: verifyOtp
├─ Find OTP by email & type
├─ Check not expired: OTP.expiresAt > now()
├─ Check not used: OTP.isUsed === false
├─ Compare provided code with stored hash
├─ Mark OTP as used (set isUsed=true, usedAt=now())
└─ Return true (single-use guarantee)

If any check fails:
└─ Throw ApiError (badRequest, notFound, conflict, etc.)
```

## Token System

### JWT Access Token

```
Structure: Header.Payload.Signature

Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (signed, not encrypted):
{
  "userId": "user_mongo_id",
  "role": "user" or "admin",
  "iat": 1234567890,
  "exp": 1234571490  (typically 1 hour)
}

Signature:
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_ACCESS_SECRET
)

Usage:
├─ Sent in Authorization header: "Bearer <token>"
├─ Or in httpOnly cookie: accessToken
├─ Verified on every protected route
└─ Short-lived (1h) for security
```

### Refresh Token

```
Structure: Stored as HASH in DB, issued as plain JWT

Generation:
├─ Create random token payload with userId
├─ Generate JWT with long expiry (7 days)
├─ Hash the plain token
└─ Store hash in RefreshToken collection

Verification:
├─ Receive plain token from client
├─ Hash it
├─ Look up stored hash in DB
├─ Check not revoked
├─ Check not expired
├─ Verify JWT signature
└─ Return decoded payload

Rotation:
├─ On refresh, old refresh token is revoked
├─ New refresh token issued
├─ Reuse detection: if old token used again → security breach
└─ Alert user or block account

RefreshToken Document:
{
  _id: ObjectId,
  userId: ObjectId,
  tokenHash: "hashed_token",
  expiresAt: Date (7 days from now),
  isRevoked: false,
  revokedAt: null,
  replacedByTokenHash: "new_token_hash",
  createdAt: Date
}
```

## Middleware Chain Detailed

```
HTTP Request
    ↓
app.use(configureSecurityHeaders)
├─ Helmet.js middleware
├─ Sets security headers
└─ Prevents common attacks

    ↓
app.use(rateLimiter)
├─ Global: 100 req/15 min per IP
├─ Per-route overrides for auth endpoints
└─ Returns 429 if limit exceeded

    ↓
app.use(express.json())
app.use(express.urlencoded())
app.use(cookieParser())
├─ Parse request body
├─ Extract cookies
└─ Attach to req.body, req.cookies

    ↓
app.use(morgan)
├─ Log request details
└─ Format: method, path, status, response time

    ↓
setupSwagger(app)
├─ Mount Swagger UI at /api/docs
└─ Serve OpenAPI.json

    ↓
app.get("/") → Redirect to /api/health

    ↓
app.use("/api", Routes)
├─ Route-specific middlewares
├─ Example: verifyAuth for protected routes
│   └─ Extract & verify JWT
│   └─ Attach user to req.user
├─ Example: validateRequest for POST/PUT
│   └─ Validate body against Zod schema
└─ Controller handler

    ↓
If route not found:
app.use(notFoundHandler)
└─ Return 404 JSON

    ↓
If any error thrown:
app.use(errorHandler)
├─ Check if ApiError or other error
├─ If ApiError: return statusCode + message
├─ If other: log, return 500
└─ Format response as JSON
```

## Database Architecture

### MongoDB Collections

```
users
├─ _id: ObjectId
├─ name: String
├─ email: String (unique)
├─ password?: String (select: false)
├─ role: String (enum: "user", "admin")
├─ provider: String (enum: "local", "google")
├─ providerId?: String
├─ avatar?: { public_id, url, size }
├─ isEmailVerified: Boolean
├─ lastLoginAt?: Date
├─ failedLoginAttempts: Number (default: 0)
├─ lockUntil?: Date
├─ isDeleted: Boolean
├─ deletedAt?: Date
├─ reActivateAvailableAt?: Date
├─ createdAt: Date
├─ updatedAt: Date
│
└─ Indexes:
   ├─ email (unique)
   ├─ provider, providerId
   ├─ role
   └─ isDeleted

refreshTokens
├─ _id: ObjectId
├─ userId: ObjectId (ref: users)
├─ tokenHash: String
├─ expiresAt: Date
├─ isRevoked: Boolean
├─ revokedAt?: Date
├─ replacedByTokenHash?: String
├─ createdAt: Date
│
└─ Indexes:
   ├─ tokenHash (for quick lookup)
   ├─ userId
   └─ expiresAt (for TTL cleanup)

otps
├─ _id: ObjectId
├─ email: String
├─ otpType: String (enum: "SIGNIN", "PASSWORD_RESET")
├─ code: String (hashed)
├─ expiresAt: Date
├─ isUsed: Boolean
├─ usedAt?: Date
├─ createdAt: Date
│
└─ Indexes:
   ├─ email, otpType
   └─ expiresAt (for TTL cleanup)
```

### Mongoose Connection Management

```
connectDB()
├─ Called on server startup
├─ Establishes MongoDB connection pool
├─ Connection pooling (default: 10 connections)
├─ Handles reconnection on network failure
└─ Exits process if connection fails

On Graceful Shutdown:
├─ Stop accepting new requests
├─ Close MongoDB connection
│  └─ Waits for in-flight operations
├─ Close Redis connection
├─ Stop scheduled jobs
└─ Exit process
```

## Redis Architecture

### Redis Usage

```
Redis Client
├─ URL: redis://localhost:6379
├─ Auto-reconnect enabled
└─ Used for:
    ├─ Rate limit state (key: ip_endpoint)
    ├─ Session storage (optional)
    └─ Token blacklist (optional)

Connection:
├─ Single connection instance
├─ Shared across app
└─ Closed on graceful shutdown
```

### Potential Redis Keys (Future)

```
Examples (not currently implemented):
├─ rate_limit:{ip} → request count
├─ session:{sessionId} → user data
├─ token_blacklist:{tokenHash} → revoked tokens
└─ TTL auto-cleanup on expiry
```

## External Service Integrations

### Email (Nodemailer)

```
Configuration:
├─ SMTP_HOST: smtp.gmail.com (or custom)
├─ SMTP_PORT: 587
├─ SMTP_USER: your-email@gmail.com
├─ SMTP_PASS: app-password (not regular password)
└─ EMAIL_FROM: noreply@example.com

Flow:
1. Service generates OTP
2. Render EJS template (signin-otp.ejs)
3. Pass variables: {{ otp_code }}, {{ expiry_time }}, etc.
4. Create nodemailer transport
5. Send email with rendered HTML
6. Log success/failure

Template Example:
├─ HTML email with OTP code
├─ Expiry information
├─ Brand styling
└─ Unsubscribe link (if needed)
```

### File Upload (Cloudinary)

```
Configuration:
├─ CLOUDINARY_CLOUD_NAME: your-cloud-name
├─ CLOUDINARY_API_KEY: api-key
├─ CLOUDINARY_API_SECRET: api-secret
└─ Public vs Secure URL

Upload Flow:
1. Client sends file in multipart/form-data
2. Multer middleware stores in memory (buffer)
3. Upload service calls Cloudinary API
4. Cloudinary returns: public_id, url, size
5. Store metadata in MongoDB User.avatar
6. Return URL to client

Delete Flow:
1. Get public_id from User.avatar
2. Call Cloudinary destroy API
3. Update User.avatar to null
4. Return 200 OK

Security:
├─ Cloudinary handles HTTPS
├─ API secret never exposed to client
├─ Signed URLs for secure delivery (if needed)
└─ Delete requires authentication
```

### OAuth2 (Passport.js)

```
Configuration:
├─ GOOGLE_CLIENT_ID: your-client-id
├─ GOOGLE_CLIENT_SECRET: your-secret
└─ GOOGLE_REDIRECT_URI: http://localhost:3000/api/oauth/google/callback

Strategy Setup:
1. Passport.js GoogleStrategy configured
2. Verifies Google tokens
3. Calls verify callback with profile
4. Returns or creates user

Token Exchange:
1. Frontend requests: GET /api/oauth/google/url
2. Returns Google authorization URL
3. User authorizes on Google consent screen
4. Redirected to: /api/oauth/google/callback?code=...
5. Backend exchanges code for tokens
6. Fetches user profile
7. Syncs user to DB
8. Issues JWT tokens
9. Sets secure cookies
10. Redirects to frontend with tokens

Trust Model:
├─ Client secret kept server-side
├─ Tokens validated server-side
├─ User never sees OAuth tokens directly
└─ Frontend receives JWT tokens
```

## Background Jobs

### Job System

```
Initialization:
├─ initJobs() called after server starts
├─ Loads all job definitions
└─ Schedules cron tasks

Job Example (System Monitor):
├─ Schedule: every 5 minutes (cron: "*/5 * * * *")
├─ Task: log memory usage, uptime
├─ Error handling: log and continue
└─ No database persistence

Structure:
const job = {
  name: "system-monitor",
  schedule: "*/5 * * * *",  // cron format
  execute: async () => {
    // Do work
    // Catch errors, don't throw
  }
};

Extensibility:
├─ Add new jobs to shared/jobs/
├─ Import in shared/jobs/index.ts
├─ Include in initJobs()
└─ No restart needed (restart server to pick up)

On Graceful Shutdown:
├─ Stop accepting new work
├─ Wait for in-flight jobs
├─ Close connections
└─ Exit process
```

## Security Model

### Authentication Flow

```
Protected Route
    ↓
verifyAuth Middleware
├─ Extract token from Authorization or cookies
├─ Verify JWT signature
├─ Check token not expired
├─ Extract userId & role
├─ Attach to req.user
└─ Call next() to proceed

If token missing/invalid:
└─ Throw ApiError.unauthorized()
```

### Authorization Flow

```
Protected Route (admin-only)
    ↓
verifyAuth Middleware
    ↓
authorizeRole Middleware
├─ Check req.user.role === "admin"
├─ If match: call next()
└─ If not match: throw ApiError.forbidden()
```

### Password Security

```
Registration:
1. User submits plaintext password
2. Hash with argon2 (slow, memory-hard)
3. Store hash in DB (never plaintext)
4. Discard plaintext

Login:
1. User submits plaintext password
2. Retrieve user.password from DB
3. Compare plaintext with stored hash
4. If match: proceed to OTP
5. If not match: increment failedLoginAttempts
```

### Account Lockout

```
Failed Login Tracking:
1. User enters wrong password
2. Increment failedLoginAttempts counter
3. If failedLoginAttempts >= 5:
   └─ Set lockUntil = now + 15 minutes
4. Subsequent login attempts while locked:
   └─ Throw ApiError.forbidden("Account locked")

After Lockout Expires:
├─ lockUntil in the past
├─ Reset failedLoginAttempts to 0
└─ User can attempt login again

Constants:
├─ LOGIN_MAX_ATTEMPTS = 5
└─ LOCK_TIME_MS = 15 * 60 * 1000
```

## Error Handling Architecture

### Error Classification

```
Operational Errors (Expected, handled gracefully):
├─ Validation errors (Zod)
├─ Not found errors (user doesn't exist)
├─ Conflict errors (email already exists)
├─ Unauthorized (invalid token)
├─ Forbidden (insufficient permissions)
├─ Rate limit (too many requests)
└─ User-facing status code + message

Programming Errors (Unexpected, should not happen):
├─ TypeError (accessing property of null)
├─ Logic errors (assertion failures)
├─ Database driver errors
└─ Status: 500 Internal Server Error
    └─ Logged for investigation
    └─ Generic "Internal Server Error" to client
```

### Error Propagation

```
Service throws ApiError
    ↓
Controller doesn't catch (let it bubble)
    ↓
asyncHandler catches and passes to next(error)
    ↓
Express errorHandler middleware
├─ Check if ApiError instance
├─ If yes: return statusCode + message
├─ If no: log, return 500
└─ Format as JSON response
```

## Deployment Readiness

### Environment-Aware Behavior

```
Development (NODE_ENV=development):
├─ Logging: pretty-printed to console
├─ Morgan format: "dev" (colored, abbreviated)
├─ Source maps: included
├─ API docs: available at /api/docs

Production (NODE_ENV=production):
├─ Logging: JSON format to stdout
├─ Morgan format: "combined" (detailed logs)
├─ Source maps: generated but not in bundle
├─ API docs: still available (or disabled)
├─ Rate limits: stricter thresholds
└─ HTTPS: enforced via env checks
```

### Graceful Shutdown

```
Process receives SIGTERM
    ↓
configureGracefulShutdown
├─ Set server to not accept new connections
├─ Wait for in-flight requests (timeout: 30s)
├─ Close MongoDB connection
├─ Close Redis connection
├─ Stop background jobs
└─ Exit process (code 0)

Benefits:
├─ No dropped requests
├─ Clean database cleanup
├─ Proper connection closure
└─ Orchestrators (Docker, k8s) can schedule restarts
```

## Scalability Considerations

### Horizontal Scaling Ready

```
Stateless Design:
├─ No in-memory user state
├─ No in-memory session storage
├─ Redis for distributed session (if needed)
└─ Multiple instances can handle requests

Load Balancer:
├─ Routes requests to multiple instances
├─ Sticky sessions optional (not required)
└─ Each instance independent

Database:
├─ MongoDB connection pooling per instance
├─ Enough pools for expected load
└─ Consider MongoDB sharding for very large data

External Services:
├─ Email: handled by Nodemailer (queuing optional)
├─ Cloudinary: handled by API calls
├─ OAuth: handled by Passport
└─ All stateless
```

### Vertical Scaling Considerations

```
Single Instance Optimization:
├─ Connection pooling (Mongoose, Redis)
├─ Rate limiting to prevent overload
├─ Async operations don't block threads
├─ Node.js event loop handles concurrency
└─ Monitor memory usage and GC pauses
```

## Monitoring & Observability

### Logging Points

```
Security Events:
├─ Failed login attempts
├─ Account lockouts
├─ Authorization failures
├─ OTP verification failures

Integration Events:
├─ Email sent/failed
├─ File upload success/failure
├─ OAuth callback completion
└─ Redis connection status

System Events:
├─ Server startup/shutdown
├─ Database connections
├─ Job execution
└─ Request latency (via Morgan)
```

### Health Check Endpoint

```
GET /api/health
├─ Checks MongoDB connection
├─ Checks Redis connection
├─ Returns: { status, timestamp, uptime, checks }
└─ Used by load balancers, monitoring tools
```

### Metrics to Monitor

```
Application:
├─ Request latency (p50, p95, p99)
├─ Error rate by endpoint
├─ Authentication success/failure rate
├─ OTP delivery success rate
└─ File upload throughput

Infrastructure:
├─ Memory usage (Node process)
├─ CPU usage
├─ Database query latency
├─ Redis latency
└─ Network I/O
```
