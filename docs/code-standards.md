# Code Standards & Conventions

**Project**: servercn-mongoose-starter v1.0.0  
**Last Updated**: 2026-04-04  
**Applies To**: All TypeScript code in `src/` directory

## Core Principles

**YAGNI** (You Aren't Gonna Need It) — Implement only required features, not speculative ones.  
**KISS** (Keep It Simple, Stupid) — Prefer simple solutions over clever ones.  
**DRY** (Don't Repeat Yourself) — Eliminate duplication through reusable modules.

## File Organization

### Directory Structure

```
src/
├── app.ts                    # Express app setup (middleware, routes, error handlers)
├── server.ts                 # Entry point (DB connect, server start, graceful shutdown)
├── routes/
│   └── index.ts             # Route aggregator for /api/v1
├── db/
│   └── db.ts                # Mongoose connection & initialization
├── modules/                  # Feature-based modules
│   ├── auth/
│   │   └── auth.controller.ts     # Auth placeholder [NEW]
│   ├── health/
│   │   ├── health.routes.ts       # Route definitions
│   │   └── health.controller.ts   # Request handlers
│   └── user/
│       ├── user.routes.ts
│       ├── user.controller.ts
│       ├── user.model.ts          # Mongoose schema + interface
│       └── user.service.ts        # Business logic (optional)
└── shared/                   # Shared utilities & middleware
    ├── configs/
    │   ├── env.ts            # Environment validation (Zod)
    │   └── swagger.ts        # Swagger UI setup
    ├── errors/
    │   └── api-error.ts      # ApiError class
    ├── middlewares/
    │   ├── error-handler.ts  # Global error handler
    │   ├── not-found-handler.ts
    │   └── security-header.ts # Security headers (Helmet + CORS) [NEW]
    ├── constants/
    │   └── status-codes.ts   # HTTP status codes
    └── utils/
        ├── api-response.ts   # ApiResponse class
        ├── async-handler.ts  # Async route wrapper
        ├── logger.ts         # Pino logger singleton
        └── shutdown.ts       # Graceful shutdown
```

### File Naming Conventions

| Type             | Case                       | Pattern               | Example                                   |
| ---------------- | -------------------------- | --------------------- | ----------------------------------------- |
| TypeScript files | kebab-case                 | `{feature}.{type}.ts` | `user.controller.ts`, `health.routes.ts`  |
| Classes          | PascalCase                 | `ClassName`           | `ApiError`, `ApiResponse`, `AsyncHandler` |
| Functions        | camelCase                  | `functionName()`      | `healthCheck()`, `errorHandler()`         |
| Constants        | UPPER_SNAKE_CASE           | `CONSTANT_NAME`       | `STATUS_CODES`, `API_BASE_PATH`           |
| Interfaces       | PascalCase with `I` prefix | `IInterfaceName`      | `IUser`, `IHealthData`                    |
| Types            | PascalCase                 | `TypeName`            | `StatusCode`, `ApiResponseParams`         |
| Variables        | camelCase                  | `variableName`        | `userId`, `statusCode`                    |
| Directories      | kebab-case                 | `{feature-name}`      | `health/`, `user/`, `shared/`             |

## Module Architecture Pattern

Each feature module follows this structure:

```
modules/user/
├── user.routes.ts      # Express Router with route definitions
├── user.controller.ts  # Request handlers (wrapped in AsyncHandler)
├── user.model.ts       # Mongoose schema + TypeScript interface
└── user.service.ts     # Business logic (optional, for complex features)
```

### Module File Responsibilities

**`{feature}.routes.ts`** — Route definitions only

```typescript
import express from "express";
import { userController } from "./user.controller";

const router = express.Router();
router.get("/:id", userController.getUser);
router.post("/", userController.createUser);
export default router;
```

**`{feature}.controller.ts`** — Request handlers wrapped with AsyncHandler

```typescript
import { AsyncHandler } from "@/shared/utils/async-handler";
import { ApiResponse } from "@/shared/utils/api-response";

export const userController = {
  getUser: AsyncHandler(async (req, res) => {
    // Validation, business logic, response
    return ApiResponse.ok(res, "User found", user);
  })
};
```

**`{feature}.model.ts`** — Mongoose schema + TypeScript interface

```typescript
import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUser>("User", userSchema);
```

**`{feature}.service.ts`** — Business logic (if controller gets too complex)

```typescript
export const userService = {
  async getUserById(id: string) {
    return User.findById(id);
  },
  async createUser(data: Partial<IUser>) {
    return User.create(data);
  }
};
```

## TypeScript Configuration

### Strict Mode (Mandatory)

All strict mode flags are enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Annotations Required

Always provide explicit type annotations:

```typescript
// ✅ Good
export function parsePort(port: string): number {
  return parseInt(port, 10);
}

const user: IUser = { email: "test@test.com", name: "Test" };
const ids: string[] = [];

// ❌ Avoid
export function parsePort(port) {
  // Missing parameter type
  return parseInt(port, 10);
}

const user = { email: "test@test.com" }; // Missing interface
```

### Path Aliases (STANDARD)

**All imports MUST use `@/*` path aliases.** Relative imports are not permitted.

The `@/` prefix resolves to `src/` directory, improving readability and avoiding fragile relative paths.

```typescript
// ✅ Good (required)
import { ApiError } from "@/shared/errors/api-error";
import { logger } from "@/shared/utils/logger";
import { AsyncHandler } from "@/shared/utils/async-handler";

// ❌ Never use relative imports
import { ApiError } from "../../shared/errors/api-error";
import { logger } from "../utils/logger";
```

**Benefits**:

- Clarity: Absolute paths immediately show where imports come from
- Maintainability: Moving files doesn't break relative imports
- Consistency: Single convention across entire codebase
- IDE support: Better autocomplete and go-to-definition

## Error Handling Pattern

### Using ApiError

All domain errors must be instances of `ApiError` with appropriate status codes:

```typescript
// ✅ Good
export const getUser = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return ApiResponse.ok(res, "User found", user);
});

// ❌ Avoid
throw new Error("User not found"); // Not an ApiError
throw ApiError.server("Invalid user"); // Wrong status code
```

### ApiError Factory Methods

```typescript
ApiError.badRequest(message, errors?)      // 400
ApiError.unauthorized(message)              // 401
ApiError.forbidden(message)                 // 403
ApiError.notFound(message)                  // 404
ApiError.conflict(message)                  // 409
ApiError.validation(message, errors?)       // 400
ApiError.notImplemented(message)            // 501
ApiError.badGateway(message)                // 502
ApiError.serviceUnavailable(message)        // 503
ApiError.tooManyRequests(message)           // 429
ApiError.server(message)                    // 500
```

## Response Format Standard

All endpoints must return consistent JSON via `ApiResponse`:

```json
{
  "success": true,
  "message": "User found",
  "statusCode": 200,
  "data": { "id": "123", "email": "test@test.com" }
}
```

Error response:

```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404,
  "errors": null
}
```

Usage in controllers:

```typescript
// Success with data
return ApiResponse.Success(res, "User created", user, 201);

// Success without data
return ApiResponse.ok(res, "Deleted successfully");

// Created (201)
return ApiResponse.created(res, "User registered", user);

// Errors (throw ApiError)
throw ApiError.badRequest("Invalid email");
```

## Async Route Handler Pattern

All async route handlers must be wrapped with `AsyncHandler`:

```typescript
// ✅ Good — AsyncHandler catches Promise rejections
export const getUser = AsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  return ApiResponse.ok(res, "User found", user);
});

// ❌ Avoid — Unhandled rejection if Database fails
export const getUser = (req: Request, res: Response) => {
  User.findById(req.params.id).then(user => {
    res.json(user);
  });
};
```

## Validation Pattern

Use Zod for runtime schema validation:

```typescript
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name required"),
  age: z.number().positive().optional()
});

export const createUser = AsyncHandler(async (req, res) => {
  // Validate request body
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Validation failed", parsed.error.flatten());
  }

  const { email, name, age } = parsed.data;
  const user = await User.create({ email, name, age });
  return ApiResponse.created(res, "User created", user);
});
```

## Logger Usage

Use Pino logger for structured logging:

```typescript
import { logger } from "@/shared/utils/logger";

// Info level (normal operations)
logger.info("User created", { userId: user.id });

// Debug level (troubleshooting)
logger.debug("Database query", { query: queryObject });

// Warn level (recoverable issues)
logger.warn("Slow query detected", { duration: 250 });

// Error level (handled errors)
logger.error(error, "Failed to create user");

// Fatal level (process should exit)
logger.fatal(error, "Database connection failed");
```

## Middleware Pattern

Express middleware follows standard signature. Security middlewares MUST be applied first:

```typescript
// ✅ Good — Applied in app.ts FIRST
export const configureSecurityHeaders = (app: Express) => {
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
};

// ✅ Custom middleware
export function customMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Middleware logic
  next();
}

// Apply to routes
app.use("/api", customMiddleware);
app.get("/health", customMiddleware, handler);
```

## Git & Commit Standards

### Conventional Commits (Enforced by commitlint)

```
<type>(<scope>): <subject>

<body>

<footer>
```

| Type       | Scope          | Example                                     |
| ---------- | -------------- | ------------------------------------------- |
| `feat`     | Feature name   | `feat(user): add JWT authentication`        |
| `fix`      | Component/area | `fix(health): incorrect uptime calculation` |
| `docs`     | Document path  | `docs: update API endpoints in README`      |
| `refactor` | Module name    | `refactor(user): extract validation logic`  |
| `test`     | Feature name   | `test(user): add registration tests`        |
| `chore`    | Tooling        | `chore(deps): upgrade Express to 5.2.1`     |

### Commit Best Practices

- One logical change per commit
- Write in imperative mood: "add feature" not "added feature"
- Reference issue/PR numbers in footer: `Closes #123`
- No AI references in messages
- Run linting & tests before committing (enforced by husky)

## Code Review Checklist

Before committing, verify:

- [ ] TypeScript strict mode passes (`pnpm typecheck`)
- [ ] ESLint passes without warnings (`pnpm lint:check`)
- [ ] Prettier formatting applied (`pnpm format:fix`)
- [ ] All async handlers wrapped with `AsyncHandler`
- [ ] All errors are `ApiError` instances with correct status codes
- [ ] All responses use `ApiResponse` class
- [ ] Environment variables validated in `env.ts`
- [ ] Database operations use Mongoose models
- [ ] Input validation with Zod schemas
- [ ] No console.log (use logger instead)
- [ ] No `any` types (use proper TypeScript types)
- [ ] No unused imports or variables
- [ ] Comments explain "why", not "what"

## Performance Guidelines

| Concern               | Standard  | Enforcement          |
| --------------------- | --------- | -------------------- |
| Function length       | <50 lines | Code review          |
| File size             | <200 LOC  | Code review          |
| Cyclomatic complexity | <10       | Code review          |
| API response time     | <100ms    | Performance testing  |
| Server startup        | <5s       | Performance baseline |
| Bundle size           | <5MB      | Build output check   |

## Common Patterns & Examples

### Creating a New Feature Module

1. Create directory: `src/modules/{feature}/`
2. Create files: `{feature}.routes.ts`, `{feature}.controller.ts`, `{feature}.model.ts`
3. Register in `src/routes/index.ts`
4. Document in API spec via Swagger comments

### Error Handling Example

```typescript
export const updateUser = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateSchema = z.object({ email: z.string().email() });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid input", parsed.error);
  }

  const user = await User.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  logger.info("User updated", { userId: user.id });
  return ApiResponse.ok(res, "User updated", user);
});
```

### Environment Variable Access

```typescript
import env from "@/shared/configs/env";

// All env vars are validated & typed
console.log(env.PORT); // number
console.log(env.NODE_ENV); // 'development' | 'test' | 'production'
console.log(env.DATABASE_URL); // string (URL)

// Never access process.env directly
// ✅ Good: type-safe, validated
// ❌ Bad: import { env } from 'process';
```

## Related Documentation

- [Project Overview & PDR](./project-overview-pdr.md) — Features, architecture, requirements
- [System Architecture](./system-architecture.md) — Request lifecycle, middleware stack
- [Codebase Summary](./codebase-summary.md) — File tree, LOC, module exports
