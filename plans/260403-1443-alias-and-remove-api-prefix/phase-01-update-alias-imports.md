# Phase 01: Update Alias Imports

## Overview

- **Priority**: P2
- **Status**: Completed
- **Description**: Replace all relative imports with `@/` path aliases across all `src/` TypeScript files.

## Key Insights

- tsconfig.json already has `"paths": { "@/*": ["./src/*"] }` and `tsc-alias` resolves aliases at build time
- All imports starting with `./` or `../` within `src/` should use `@/` from the `src/` root
- Same-module imports (e.g., `./health.controller`) also convert to full `@/modules/health/health.controller`
- External package imports (express, mongoose, zod, pino, etc.) are unchanged

## Related Code Files

### Modify

- `src/app.ts`
- `src/server.ts`
- `src/routes/index.ts`
- `src/db/db.ts`
- `src/modules/health/health.routes.ts`
- `src/modules/health/health.controller.ts`
- `src/shared/configs/swagger.ts`
- `src/shared/errors/api-error.ts`
- `src/shared/middlewares/error-handler.ts`
- `src/shared/middlewares/not-found-handler.ts`
- `src/shared/utils/api-response.ts`
- `src/shared/utils/logger.ts`
- `src/shared/utils/shutdown.ts`

## Implementation Steps

### 1. `src/app.ts`

```ts
// Before
import Routes from "./routes/index";
import { errorHandler } from "./shared/middlewares/error-handler";
import { notFoundHandler } from "./shared/middlewares/not-found-handler";
import { setupSwagger } from "./shared/configs/swagger";
import env from "./shared/configs/env";

// After
import Routes from "@/routes/index";
import { errorHandler } from "@/shared/middlewares/error-handler";
import { notFoundHandler } from "@/shared/middlewares/not-found-handler";
import { setupSwagger } from "@/shared/configs/swagger";
import env from "@/shared/configs/env";
```

### 2. `src/server.ts`

```ts
// Before
import app from "./app";
import { connectDB } from "./db/db";
import env from "./shared/configs/env";
import { logger } from "./shared/utils/logger";
import { configureGracefulShutdown } from "./shared/utils/shutdown";

// After
import app from "@/app";
import { connectDB } from "@/db/db";
import env from "@/shared/configs/env";
import { logger } from "@/shared/utils/logger";
import { configureGracefulShutdown } from "@/shared/utils/shutdown";
```

### 3. `src/routes/index.ts`

```ts
// Before
import HealthRouter from "../modules/health/health.routes";
// After
import HealthRouter from "@/modules/health/health.routes";
```

### 4. `src/db/db.ts`

```ts
// Before
import env from "../shared/configs/env";
import { logger } from "../shared/utils/logger";
// After
import env from "@/shared/configs/env";
import { logger } from "@/shared/utils/logger";
```

### 5. `src/modules/health/health.routes.ts`

```ts
// Before
import { healthCheck, detailedHealthCheck } from "./health.controller";
// After
import {
  healthCheck,
  detailedHealthCheck
} from "@/modules/health/health.controller";
```

### 6. `src/modules/health/health.controller.ts`

```ts
// Before
import { ApiResponse } from "../../shared/utils/api-response";
import { AsyncHandler } from "../../shared/utils/async-handler";
// After
import { ApiResponse } from "@/shared/utils/api-response";
import { AsyncHandler } from "@/shared/utils/async-handler";
```

### 7. `src/shared/configs/swagger.ts`

```ts
// Before
import env from "./env";
// After
import env from "@/shared/configs/env";
```

### 8. `src/shared/errors/api-error.ts`

```ts
// Before
import { STATUS_CODES, StatusCode } from "../constants/status-codes";
// After
import { STATUS_CODES, StatusCode } from "@/shared/constants/status-codes";
```

### 9. `src/shared/middlewares/error-handler.ts`

```ts
// Before
import env from "../configs/env";
import { logger } from "../utils/logger";
import { ApiError } from "../errors/api-error";
// After
import env from "@/shared/configs/env";
import { logger } from "@/shared/utils/logger";
import { ApiError } from "@/shared/errors/api-error";
```

### 10. `src/shared/middlewares/not-found-handler.ts`

```ts
// Before
import { ApiError } from "../errors/api-error";
// After
import { ApiError } from "@/shared/errors/api-error";
```

### 11. `src/shared/utils/api-response.ts`

```ts
// Before
import { STATUS_CODES, StatusCode } from "../constants/status-codes";
// After
import { STATUS_CODES, StatusCode } from "@/shared/constants/status-codes";
```

### 12. `src/shared/utils/logger.ts`

```ts
// Before
import env from "../configs/env";
// After
import env from "@/shared/configs/env";
```

### 13. `src/shared/utils/shutdown.ts`

```ts
// Before
import { logger } from "./logger";
// After
import { logger } from "@/shared/utils/logger";
```

## Todo List

- [x] Update `src/app.ts` imports
- [x] Update `src/server.ts` imports
- [x] Update `src/routes/index.ts` imports
- [x] Update `src/db/db.ts` imports
- [x] Update `src/modules/health/health.routes.ts` imports
- [x] Update `src/modules/health/health.controller.ts` imports
- [x] Update `src/shared/configs/swagger.ts` imports
- [x] Update `src/shared/errors/api-error.ts` imports
- [x] Update `src/shared/middlewares/error-handler.ts` imports
- [x] Update `src/shared/middlewares/not-found-handler.ts` imports
- [x] Update `src/shared/utils/api-response.ts` imports
- [x] Update `src/shared/utils/logger.ts` imports
- [x] Update `src/shared/utils/shutdown.ts` imports
- [x] Run `pnpm typecheck` — must pass with 0 errors

## Success Criteria

- `pnpm typecheck` passes with 0 errors
- No relative imports (`../` or `./`) remain in any `src/` file
- Build: `pnpm build` completes successfully

## Risk Assessment

- **Low risk**: Pure import path rename, no logic change
- tsc-alias handles build-time resolution; tsx handles dev-time resolution via tsconfig paths
