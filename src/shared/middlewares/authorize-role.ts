import { NextFunction, Request, Response } from "express";

import { ApiError } from "@/shared/errors/api-error";

import type { UserRole } from "@/types/global";

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // 1. Check if user is authenticated
    if (!req.user) {
      return next(ApiError.unauthorized("Unauthorized, Please login first."));
    }

    // 2. Check if user has required role
    // Note: Ensure 'role' exists on req.user. You might strictly type this.
    if (!req.user.role || !allowedRoles.includes(req?.user?.role)) {
      return next(
        ApiError.forbidden(
          "Forbidden. You do not have permission to access this resource"
        )
      );
    }
    next();
  };
};
