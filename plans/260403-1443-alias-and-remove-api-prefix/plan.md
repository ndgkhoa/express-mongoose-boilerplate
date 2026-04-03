---
title: "Alias Imports & Remove /api/v1 Prefix"
description: "Replace all relative imports with @/ path aliases; remove /api/v1 prefix from router mounting."
status: completed
priority: P2
effort: 30m
issue:
branch: main
tags: [refactor, backend]
created: 2026-04-03
---

# Alias Imports & Remove /api/v1 Prefix

## Overview

Two pure refactoring changes — no new features, no logic changes.

1. **Alias imports**: Replace all relative imports (`../../shared/...`) with `@/` path aliases across all `src/` files. tsconfig already configured (`@/* → ./src/*`), tsc-alias already installed.
2. **Remove /api/v1 prefix**: Change `app.use("/api/v1", Routes)` to `app.use(Routes)` and update the root redirect.

## Phases

| #   | Phase                                  | Status    | Effort | Link                                           |
| --- | -------------------------------------- | --------- | ------ | ---------------------------------------------- |
| 1   | Update alias imports in all src/ files | Completed | 20m    | [phase-01](./phase-01-update-alias-imports.md) |
| 2   | Remove /api/v1 router prefix           | Completed | 10m    | [phase-02](./phase-02-remove-api-v1-prefix.md) |

## Dependencies

- TypeScript path aliases already configured in `tsconfig.json` (`@/* → ./src/*`)
- `tsc-alias` already installed for build-time resolution
- No external dependencies required
