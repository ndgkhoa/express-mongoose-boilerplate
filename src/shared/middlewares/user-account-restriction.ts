import { NextFunction, Request, Response } from "express";

import { ApiError } from "@/shared/errors/api-error";
import { logger } from "@/shared/utils/logger";

import User from "@/modules/user/user.model";

export async function checkUserAccountRestriction(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?._id) {
      return next(ApiError.unauthorized("Unauthorized"));
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return next(ApiError.unauthorized("Unauthorized, please login."));
    }

    if (user.isDeleted || user.deletedAt) {
      return next(ApiError.forbidden("Your account has been deactivated."));
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / (1000 * 60)
      );

      return next(
        ApiError.forbidden(
          `Your account has been locked. Please try again after ${minutesLeft} minutes.`
        )
      );
    }

    if (!user.isEmailVerified) {
      return next(
        ApiError.forbidden("Email not verified. Please verify your email.")
      );
    }

    return next();
  } catch (err: any) {
    logger.error(err?.message || err);
    return next(ApiError.server("Something went wrong"));
  }
}
