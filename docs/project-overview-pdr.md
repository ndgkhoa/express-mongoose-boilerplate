# Project Overview & Product Development Requirements

## Project Identity

**Name**: servercn-mongoose-starter  
**Version**: 1.0.0  
**Type**: Express.js API Starter Template  
**Status**: Active Development  
**Repository**: https://github.com/yourusername/servercn-mongoose-starter

## Purpose

`servercn-mongoose-starter` is a production-ready Express.js + MongoDB starter template designed to accelerate backend API development. It provides:

- Battle-tested project structure with feature-based modular architecture
- Pre-configured TypeScript with strict mode and path aliases
- Security best practices (Helmet, CORS, input validation)
- Structured error handling and API response normalization
- Environment validation at startup using Zod
- Graceful shutdown handling
- Development tools (Swagger docs, Morgan HTTP logging, Pino structured logging)
- Code quality enforcement (ESLint, Prettier, Husky pre-commit hooks, commitlint)

**Target Audience**: Backend developers building REST APIs with Node.js/Express + MongoDB  
**Deployment Target**: Docker, Kubernetes, or traditional VPS environments

## Technology Stack

| Layer            | Technology                       | Version    | Purpose                               |
| ---------------- | -------------------------------- | ---------- | ------------------------------------- |
| **Runtime**      | Node.js + ESM                    | Latest LTS | JavaScript runtime with ES modules    |
| **Language**     | TypeScript                       | 6.0+       | Type safety, strict mode enabled      |
| **Framework**    | Express                          | 5.x        | HTTP server & routing                 |
| **Database**     | MongoDB + Mongoose               | 9.x        | NoSQL database & ODM                  |
| **Validation**   | Zod                              | 4.x        | Runtime schema & env validation       |
| **Logging**      | Pino + pino-pretty               | 10.x       | Structured logging (dev/prod)         |
| **Security**     | Helmet, CORS                     | Latest     | HTTP headers, cross-origin requests   |
| **HTTP Logging** | Morgan                           | 1.10+      | Request/response logging              |
| **API Docs**     | swagger-autogen + UI             | 2.23+      | Auto-generated OpenAPI docs           |
| **Build**        | TypeScript Compiler + tsc-alias  | 6.0+       | Compilation & path resolution         |
| **Dev Runtime**  | tsx                              | 4.21+      | Hot-reload development server         |
| **Code Quality** | ESLint + Prettier                | Latest     | Linting & code formatting             |
| **Git Hooks**    | Husky + lint-staged + commitlint | Latest     | Pre-commit checks & commit validation |

## Core Architecture

### Architectural Style

**Feature-Based Modular Architecture** — Code is organized by business feature, not by technical layer.

```
src/
├── modules/          # Feature modules (user, health, auth, etc.)
│   ├── health/      # Health check feature
│   ├── user/        # User management feature
│   └── ...
├── shared/          # Shared utilities, middleware, configs
│   ├── configs/     # Environment, Swagger setup
│   ├── errors/      # Error classes & handling
│   ├── middlewares/ # Express middleware
│   ├── constants/   # Status codes, enums
│   └── utils/       # Helper functions & classes
├── routes/          # Route aggregator
├── db/              # Database connection
├── app.ts           # Express app setup
└── server.ts        # Entry point
```

### API Path Structure

Routes are organized by feature modules (health, user, etc.) with no version prefix. All routes are accessible directly from root (e.g., `/health`, `/health/detailed`).

## Environment Configuration

### Required Environment Variables

| Variable       | Type   | Default               | Description                                                                  |
| -------------- | ------ | --------------------- | ---------------------------------------------------------------------------- |
| `NODE_ENV`     | enum   | development           | Runtime environment: `development` \| `test` \| `production`                 |
| `PORT`         | number | 3000                  | Server port                                                                  |
| `DATABASE_URL` | URL    | -                     | MongoDB connection string (e.g., mongodb://localhost:27017/dbname)           |
| `CORS_ORIGIN`  | URL    | http://localhost:3000 | Allowed CORS origin for frontend requests                                    |
| `LOG_LEVEL`    | enum   | info                  | Pino log level: `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` |

**Setup**: Create `.env.development.local` and `.env.production.local` files. The project uses `dotenv-flow` to load environment variables with proper precedence.

**Validation**: All env vars are validated at startup using Zod schema in `src/shared/configs/env.ts`. Invalid config exits the process immediately.

## Package Scripts

| Script         | Command                                                      | Purpose                                  |
| -------------- | ------------------------------------------------------------ | ---------------------------------------- |
| `dev`          | `cross-env NODE_ENV=development npx tsx watch src/server.ts` | Development with hot reload              |
| `build`        | `rm -rf dist && tsc && tsc-alias`                            | TypeScript compilation & path resolution |
| `start`        | `cross-env NODE_ENV=production node dist/server.js`          | Production server (requires build first) |
| `typecheck`    | `tsc --noEmit`                                               | Check TypeScript without emitting        |
| `lint:check`   | `eslint .`                                                   | Check linting violations                 |
| `lint:fix`     | `eslint . --fix`                                             | Auto-fix linting violations              |
| `format:check` | `prettier . --check`                                         | Check code formatting                    |
| `format:fix`   | `prettier . --write`                                         | Auto-format code                         |
| `docs:gen`     | `npx tsx swagger.config.ts`                                  | Generate Swagger/OpenAPI documentation   |
| `prepare`      | `husky`                                                      | Initialize Husky pre-commit hooks        |

## Current API Endpoints

### Health Check Endpoints

| Method | Path               | Status | Response                                                           |
| ------ | ------------------ | ------ | ------------------------------------------------------------------ |
| GET    | `/health`          | 200 OK | `{ status, timestamp, uptime }`                                    |
| GET    | `/health/detailed` | 200 OK | `{ status, timestamp, uptime, environment, version, memory, cpu }` |

**Response Format** (ApiResponse):

```json
{
  "success": true,
  "message": "Service is healthy",
  "statusCode": 200,
  "data": {
    "status": "healthy",
    "timestamp": "2026-04-03T14:30:00.000Z",
    "uptime": 45.123
  }
}
```

## Development Workflow

### Commit Convention

Uses Conventional Commits (enforced by commitlint):

```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: reorganize code
test: add or update tests
chore: dependencies, tooling
```

### Pre-commit Checks

Husky + lint-staged automatically run before commits:

- ESLint auto-fix (`.ts` files)
- Prettier auto-format (`.ts`, `.json`, `.md`, `.yml` files)
- TypeScript type checking (`tsc --noEmit`)

### Code Quality Gate

All pull requests must pass:

- ESLint (no style violations)
- Prettier (consistent formatting)
- TypeScript strict mode (no type errors)
- All tests (100% pass rate)

## Key Features & Patterns

### Error Handling

- **ApiError Class**: Custom error with factory methods for common HTTP errors
  - `ApiError.badRequest()` → 400
  - `ApiError.unauthorized()` → 401
  - `ApiError.forbidden()` → 403
  - `ApiError.notFound()` → 404
  - `ApiError.conflict()` → 409
  - `ApiError.server()` → 500
- **Global Error Handler**: Catches all errors, formats response, logs appropriately
- **Operational vs Programmer Errors**: `isOperational` flag distinguishes handled vs unexpected errors

### Response Normalization

- **ApiResponse Class**: Consistent JSON response structure across all endpoints
- Methods: `Success()`, `ok()`, `created()`
- Includes: `success`, `message`, `statusCode`, `data`, `errors`

### Async Route Handling

- **AsyncHandler**: HOF that wraps async route handlers and catches Promise rejections
- Automatically forwards errors to Express error handler middleware
- Eliminates need for try-catch in every route handler

### Security

- **Helmet**: Secures HTTP headers against common vulnerabilities
- **CORS**: Restricted to configured origin, supports credentials
- **Input Validation**: Zod schemas can be layered on request bodies
- **Cookie Parser**: Secure cookie handling
- **Morgan HTTP Logging**: All requests logged for audit trail

### Structured Logging

- **Pino Logger**: High-performance structured logging
- **Dev Mode**: Colorized pretty-printed logs for readability
- **Prod Mode**: JSON logs for log aggregation (ELK, Datadog, etc.)
- **Single Logger Instance**: Exported from `src/shared/utils/logger.ts`

### Database

- **MongoDB Connection**: Managed in `src/db/db.ts`
- **Mongoose Models**: TypeScript interfaces + schemas in feature modules
- **Graceful Shutdown**: Closes MongoDB connection cleanly on process termination

## PDR: Product Development Requirements

### Phase 1: Foundation (Current - v1.0.0)

**Status**: Complete

- Express app with middleware stack
- MongoDB + Mongoose connection
- Health check endpoints
- Error handling & response normalization
- Environment validation with Zod
- Graceful shutdown
- Swagger documentation setup
- ESLint, Prettier, Husky, commitlint
- TypeScript strict mode

### Phase 2: Core Features (Planned - v1.1.0)

**Status**: Pending

**Functional Requirements**:

- [ ] User authentication (JWT)
- [ ] User registration & login
- [ ] User profile CRUD
- [ ] Password hashing & verification
- [ ] Refresh token mechanism
- [ ] User roles & permissions

**Non-Functional Requirements**:

- Comprehensive unit & integration tests (>80% coverage)
- API documentation (Swagger)
- Input validation (Zod schemas)
- Rate limiting per endpoint
- Request logging & audit trail

### Phase 3: Advanced Features (Planned - v1.2.0)

**Status**: Pending

- Caching layer (Redis)
- Email notifications (SendGrid/Nodemailer)
- File upload handling (AWS S3)
- Pagination & filtering standards
- Soft delete support
- Audit logging

### Phase 4: Operations (Planned - v1.3.0)

**Status**: Pending

- Docker containerization
- Kubernetes manifests
- CI/CD pipeline (GitHub Actions)
- Monitoring & alerting (Prometheus, Grafana)
- Database migrations tooling

## Success Metrics

| Metric                     | Target | Current      |
| -------------------------- | ------ | ------------ |
| Test Coverage              | >80%   | 0% (pending) |
| TypeScript strict mode     | 100%   | 100%         |
| ESLint passing             | 100%   | 100%         |
| API endpoint response time | <100ms | Varies       |
| Server startup time        | <5s    | ~1-2s        |
| Graceful shutdown time     | <10s   | ~3-5s        |

## Related Documentation

- [Code Standards](./code-standards.md) — Naming conventions, file structure, patterns
- [System Architecture](./system-architecture.md) — Request lifecycle, middleware stack, error flow
- [Codebase Summary](./codebase-summary.md) — File tree, LOC estimates, module exports
- [Project Roadmap](./project-roadmap.md) — Milestones, feature backlog, timeline
