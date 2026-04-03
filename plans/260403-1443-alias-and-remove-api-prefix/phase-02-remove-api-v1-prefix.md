# Phase 02: Remove /api/v1 Router Prefix

## Overview

- **Priority**: P2
- **Status**: Completed
- **Description**: Remove the `/api/v1` version prefix from router mounting in `app.ts`. Routes will be accessible at root (e.g., `/health` instead of `/api/v1/health`).

## Key Insights

- Only `src/app.ts` needs changing (2 lines)
- Swagger docs path `/api/docs` is separate — no change needed
- Root redirect `GET /` should update from `/api/v1/health` → `/health`

## Related Code Files

### Modify

- `src/app.ts` — remove prefix from `app.use()` and update redirect

## Implementation Steps

### 1. Update router mounting in `src/app.ts`

```ts
// Before
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/api/v1/health");
});
app.use("/api/v1", Routes);

// After
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/health");
});
app.use(Routes);
```

## Todo List

- [x] In `src/app.ts`: change `app.use("/api/v1", Routes)` → `app.use(Routes)`
- [x] In `src/app.ts`: change redirect target from `"/api/v1/health"` → `"/health"`
- [x] Run `pnpm typecheck` — must pass with 0 errors
- [x] Verify `GET /health` responds (not `/api/v1/health`)

## Success Criteria

- Routes accessible without `/api/v1` prefix
- `GET /` redirects to `/health`
- `pnpm typecheck` passes

## Risk Assessment

- **Low risk**: 2-line change in one file
- **Breaking change**: Any client code or tests calling `/api/v1/*` paths must update — but this is a starter template with no existing consumers

## Next Steps

- After both phases complete, run `pnpm typecheck` and `pnpm build`
