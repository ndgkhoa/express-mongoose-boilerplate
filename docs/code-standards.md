# Code Standards & Conventions

## File Naming

### TypeScript/JavaScript Files

- **Convention:** kebab-case with descriptive names
- **Pattern:** `{feature}-{type}.ts` (e.g., `auth.controller.ts`, `verify-auth.ts`)
- **Goal:** Self-documenting names for tooling (Grep, Glob, LSP)

**Examples:**

```
auth.service.ts           (service)
auth.controller.ts        (controller)
auth.routes.ts            (routes)
auth.validator.ts         (validation schemas)
verify-auth.ts            (middleware)
rate-limiter.ts           (middleware)
refresh-token.model.ts    (model)
user-account-restriction.ts (middleware)
token.helper.ts           (helper utility)
```

**Avoid:**

```
Auth.ts                   (too generic)
authService.ts            (camelCase not preferred)
auth_service.ts           (snake_case)
```

### Configuration Files

- `*.config.ts` or `*.config.json` suffix
- Examples: `swagger.config.ts`, `tsconfig.json`, `commitlint.config.ts`

### Model Files

- Suffix: `.model.ts`
- Examples: `user.model.ts`, `refresh-token.model.ts`

## Directory Structure

### Feature-Based Organization

```
modules/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.routes.ts
│   ├── auth.validator.ts
│   └── refresh-token.model.ts
├── user/
│   ├── user.model.ts
│   └── user.routes.ts
└── oauth/
    ├── oauth.service.ts
    ├── oauth.controller.ts
    └── oauth.routes.ts
```

**Rationale:** Modules are self-contained, easy to locate and maintain, scales well as features grow.

### Shared Directory

```
shared/
├── configs/         (external service configuration)
├── constants/       (static values, enum constants)
├── errors/          (error classes)
├── helpers/         (pure utility functions)
├── jobs/            (background job definitions)
├── middlewares/     (Express middleware functions)
└── utils/           (general-purpose utilities)
```

## Module Structure Pattern

Every feature module follows this structure:

```
module/
├── {feature}.controller.ts  # Request handlers
├── {feature}.service.ts     # Business logic
├── {feature}.routes.ts      # Route definitions
├── {feature}.validator.ts   # Zod validation schemas (if needed)
└── {feature}.model.ts       # Mongoose models (if needed)
```

### controller.ts

```typescript
// Responsibilities:
// - Extract request data
// - Call service methods
// - Format and send responses
// - No business logic

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  ApiResponse.created(res, "User registered", user);
});
```

### service.ts

```typescript
// Responsibilities:
// - All business logic
// - Database operations
// - External service calls
// - Data transformations
// - Error throwing (ApiError)

export const registerUser = async data => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw ApiError.conflict("Email exists");
  return User.create(data);
};
```

### routes.ts

```typescript
// Responsibilities:
// - Define endpoints
// - Attach middlewares
// - Validate request bodies with validateRequest

const router = Router();

router.post("/register", validateRequest(signupSchema), asyncHandler(register));

export default router;
```

### validator.ts

```typescript
// Zod schemas only
// One schema per operation

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
});
```

### model.ts

```typescript
// Mongoose schema definition
// Interface definition
// Model export

export interface IUser extends Document {
  name: string;
  email: string;
  // ...
}

const userSchema = new Schema<IUser>({
  name: String
  // ...
});

export default mongoose.model<IUser>("User", userSchema);
```

## Middleware Pattern

```typescript
// middleware/verify-auth.ts
import { NextFunction, Request, Response } from "express";

export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    const decoded = verifyAccessToken(token);
    req.user = { _id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    throw ApiError.unauthorized("Invalid token");
  }
};

// Routes
router.get("/profile", verifyAuth, getProfile);
```

## Error Handling Pattern

### Throwing Errors

```typescript
// Use ApiError static factory methods
if (!user) throw ApiError.notFound("User not found");
if (locked) throw ApiError.forbidden("Account locked");
if (exists) throw ApiError.conflict("Email exists");

// For validation (Zod errors auto-caught)
throw ApiError.validation("Invalid input", zodError.errors);
```

### Catching Errors

```typescript
// Global handler catches all ApiError instances
// Non-operational errors logged and return 500
// Operational errors (isOperational: true) returned with statusCode
```

### Response Format

```typescript
// Success
{ success: true, message: "OK", statusCode: 200, data: {...} }

// Error
{ success: false, message: "Not found", statusCode: 404 }

// Validation error
{ success: false, message: "Validation failed", statusCode: 400, errors: [...] }
```

## Validation Pattern

### Using Zod

```typescript
// Define schema
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password too short")
});

// In controller (via middleware)
router.post(
  "/login",
  validateRequest(loginSchema), // Auto-validates, passes data to next
  controller
);

// In service (if additional validation needed)
export const login = async (data: z.infer<typeof loginSchema>) => {
  // data is already typed and validated
};
```

### Validation Middleware

```typescript
// middleware/validate-request.ts
export const validateRequest =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (err) {
      throw ApiError.validation("Invalid input", err.errors);
    }
  };
```

## Async/Await Pattern

### Async Handler Wrapper

```typescript
// All route handlers must use asyncHandler
// Catches unhandled promise rejections

const handler = asyncHandler(async (req, res) => {
  const data = await someAsync();
  ApiResponse.ok(res, "OK", data);
});

// asyncHandler implementation
export const asyncHandler =
  (fn: HandlerFunction) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

### Try-Catch in Services

```typescript
// Always try-catch in services for manual cleanup
export const loginUser = async (email: string, password: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({ email }).session(session);
    // ... business logic ...
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err; // Let controller/global handler deal with it
  }
};
```

## API Response Pattern

```typescript
// Success responses
ApiResponse.ok(res, "User found", user); // 200
ApiResponse.created(res, "User created", user); // 201

// Error responses (thrown, caught by global handler)
throw ApiError.badRequest("Invalid input"); // 400
throw ApiError.unauthorized("Token expired"); // 401
throw ApiError.forbidden("Not allowed"); // 403
throw ApiError.notFound("User not found"); // 404
throw ApiError.conflict("Email exists"); // 409
throw ApiError.tooManyRequests("Rate limited"); // 429
throw ApiError.server("Internal error"); // 500
```

## Type Safety

### Strict TypeScript Mode

```typescript
// tsconfig.json enables strict mode:
// - noImplicitAny: true
// - strictNullChecks: true
// - strictFunctionTypes: true
// - noImplicitThis: true
// - noUnusedLocals: true
// - noUnusedParameters: true
// - noImplicitReturns: true

// No any types allowed
const data = req.body;  // ERROR: Must be typed

// Use type inference
const user = await User.findById(id);  // user: IUser | null (inferred)

// Or explicit types
const user: IUser | null = await User.findById(id);
```

### Function Signatures

```typescript
// Always type parameters and return values
export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password);
};

// For async handlers
export const getUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(req.user?._id);
    ApiResponse.ok(res, "User found", user);
  }
);
```

### Generic Functions

```typescript
// Use generics for flexible utilities
export class ApiResponse<T = unknown> {
  public readonly data?: T | null;

  static ok<T>(res: Response, message: string, data?: T) {
    return new ApiResponse<T>({ success: true, message, data }).send(res);
  }
}
```

## Import Organization

### Path Alias

```typescript
// Use @/ alias for all absolute imports
// Configured in tsconfig.json: "@/*": ["./src/*"]

// ✓ Good
import env from "@/shared/configs/env";
import User from "@/modules/user/user.model";
import { ApiError } from "@/shared/errors/api-error";

// ✗ Avoid
import env from "../../shared/configs/env";
import User from "../user/user.model";
```

### Import Order

```typescript
// 1. External packages
import express, { Router } from "express";
import mongoose from "mongoose";

// 2. Internal modules/shared
import env from "@/shared/configs/env";
import { ApiError } from "@/shared/errors/api-error";

import User from "@/modules/user/user.model";
// 3. Types/interfaces
import type { IUser } from "@/modules/user/user.model";

// 4. Constants/enums
import { UserRoleConst } from "@/types/enums";
```

**Tooling:** Prettier plugin `@trivago/prettier-plugin-sort-imports` auto-sorts imports.

## Code Style & Formatting

### ESLint & Prettier

```json
// .eslintrc / .prettierrc auto-applied via husky pre-commit hooks
// Rules:
// - No unused variables
// - No implicit any
// - 2-space indentation
// - Single quotes
// - No semicolons (Prettier removes them)
// - Max line length 100
```

### Variable Naming

```typescript
// Descriptive, camelCase
const authToken = req.headers.authorization; // ✓
const t = req.headers.authorization; // ✗

// Boolean variables start with is/has
const isAuthenticated = !!token; // ✓
const authenticated = !!token; // ✗

// Avoid acronyms unless clear
const userData = user; // ✓
const usr = user; // ✗
```

### Comments

```typescript
// Use comments sparingly (code should be self-documenting)

// ✓ Comment why, not what
// Account locked after 5 failed attempts for 15 minutes
if (user.lockUntil && user.lockUntil > new Date()) {
  throw ApiError.forbidden("Account locked");
}

// ✗ Obvious comments
// Check if lockUntil exists and is in future
if (user.lockUntil && user.lockUntil > new Date()) {
```

## Environment Configuration

### Loading & Validation

```typescript
// configs/env.ts validates all required vars at startup
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32)
  // ...
});

const env = envSchema.parse(process.env);
export default env;
```

### Usage Pattern

```typescript
// Import env from shared config
import env from "@/shared/configs/env";

// Access directly
const port = env.PORT;
const isDev = env.NODE_ENV === "development";

// Never access process.env directly elsewhere
// process.env.SOME_VAR;  // ✗ Avoid
```

### Environment File Format

```bash
# .env (or .env.local, .env.development)
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/dbname
JWT_ACCESS_SECRET=your-secret-key-32-chars-minimum
# All vars required by envSchema must be present
```

## Testing Patterns (Prepared Structure)

While tests aren't implemented yet, follow these patterns:

```typescript
// test/modules/auth/auth.service.test.ts
describe("auth.service", () => {
  describe("registerUser", () => {
    it("should create user with hashed password", async () => {
      const user = await registerUser({
        email: "test@example.com",
        password: "password123",
        name: "Test User"
      });

      expect(user.email).toBe("test@example.com");
      expect(user.password).not.toBe("password123"); // hashed
    });

    it("should throw conflict error if email exists", async () => {
      // Create user first
      await registerUser(userData);

      // Attempt duplicate
      await expect(registerUser(userData)).rejects.toThrow(
        expect.objectContaining({ statusCode: 409 })
      );
    });
  });
});
```

## Logging Pattern

### Using Pino Logger

```typescript
import { logger } from "@/shared/utils/logger";

// Level-based logging
logger.debug("Processing user", { userId: "123" });
logger.info("User registered successfully");
logger.warn("Rate limit approaching", { remainingRequests: 5 });
logger.error(error, "Failed to upload file");

// In development: pretty-printed to console
// In production: structured JSON to stdout
```

## Database Patterns

### Mongoose Queries

```typescript
// Always use typings
export const getUserById = async (id: string): Promise<IUser | null> => {
  return User.findById(id);
};

// Select fields explicitly
const user = await User.findById(id).select("+password"); // Include password

// Use indexes for frequently queried fields
userSchema.index({ email: 1 });
userSchema.index({ provider: 1, providerId: 1 });

// Transactions for multi-document changes
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Multiple operations
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
}
```

### Population & References

```typescript
// If using references (not in current schema)
const user = await User.findById(id).populate("profileId");
```

## Security Best Practices

### Password Hashing

```typescript
import { hashPassword, verifyPassword } from "@/shared/helpers/auth.helpers";

// Hashing (Argon2 - slow, memory-hard)
const hashed = await hashPassword(plainPassword);
await User.create({ password: hashed });

// Verification
const isValid = await verifyPassword(plainPassword, hashedPassword);
```

### Token Handling

```typescript
// Store hashed tokens in database
const tokenHash = await generateHashedToken(plainToken);
await RefreshToken.create({ tokenHash, userId, expiresAt });

// Verify by comparing hashes
const storedHash = await RefreshToken.findOne({
  tokenHash: hashToken(provided)
});
```

### OTP Security

```typescript
// OTPs are time-limited and single-use
export const verifyOtp = async (email: string, code: string, type: OtpType) => {
  const otp = await OTP.findOne({ email, otpType: type });

  if (!otp) throw ApiError.notFound("OTP not found");
  if (otp.isUsed) throw ApiError.conflict("OTP already used");
  if (otp.expiresAt < new Date()) throw ApiError.badRequest("OTP expired");
  if (otp.code !== code) throw ApiError.badRequest("Invalid OTP");

  // Mark as used
  otp.isUsed = true;
  otp.usedAt = new Date();
  await otp.save();

  return { valid: true };
};
```

## Build & Compilation

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "es2022",
    "strict": true,
    "sourceMap": true,
    "declaration": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Build Process

```bash
# 1. TypeScript compilation (output to dist/)
# 2. Path alias resolution (tsc-alias)
# 3. Resulting dist/ has .js files ready for node

npm run build     # Full build
npm run typecheck # Type checking only (no emit)
```

## Continuous Integration

### Pre-commit Hooks (Husky)

```bash
# Automatically runs on git commit:
# 1. lint-staged (eslint --fix, prettier --write)
# 2. Commit message validation (commitlint)

# If checks fail, commit is blocked
# Fix issues, stage again, commit again
```

### Conventional Commits

```
feat: add Google OAuth integration
fix: prevent account unlock on wrong OTP
docs: update authentication flow
refactor: extract token helpers
test: add auth service tests
chore: update dependencies
```

Format: `{type}: {description}` (lowercase, no period)

## Performance Considerations

### Connection Pooling

```typescript
// Mongoose auto-pools MongoDB connections
// Redis maintains a single connection with auto-reconnect
// Don't create multiple client instances
```

### Selective Field Queries

```typescript
// Password not selected by default (marked select: false)
const user = await User.findById(id);          // password excluded
const user = await User.findById(id).select("+password");  // password included
```

### Index Strategy

```typescript
// Indexes on frequently queried fields
userSchema.index({ email: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ provider: 1, providerId: 1 });
```

## Code Review Checklist

Before committing:

- [ ] No `any` types
- [ ] All errors use `ApiError`
- [ ] All async operations use `asyncHandler` or try-catch
- [ ] Request body validated with Zod
- [ ] Response formatted with `ApiResponse`
- [ ] No console.log (use logger)
- [ ] No hardcoded secrets
- [ ] Comments explain why, not what
- [ ] Imports organized and use `@/` alias
- [ ] File names kebab-case
- [ ] Tests pass (when implemented)
