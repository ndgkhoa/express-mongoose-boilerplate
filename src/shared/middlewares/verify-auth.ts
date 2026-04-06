import { NextFunction, Request, Response } from "express";

import { REFRESH_TOKEN_EXPIRY } from "@/shared/constants/auth.constants";
import { ApiError } from "@/shared/errors/api-error";
import { setAuthCookies } from "@/shared/helpers/cookie.helper";
import { generateHashedToken } from "@/shared/helpers/token.helper";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from "@/shared/utils/jwt";
import { logger } from "@/shared/utils/logger";

import RefreshToken from "@/modules/auth/refresh-token.model";
import User from "@/modules/user/user.model";

/**
 * Express middleware that authenticates a request via access or refresh token.
 *
 * Strategy:
 *   1. Validate the access token from cookies; attach decoded user to req if valid.
 *   2. Fall back to the refresh token: verify, check revocation/expiry, rotate tokens,
 *      set new cookies, and attach the user to req.
 *
 * Calls next(ApiError.unauthorized) on any failure.
 */
export const verifyAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  // Prefer access token — fast path, no DB lookup needed
  if (accessToken) {
    try {
      const decoded = verifyAccessToken(accessToken);
      req.user = decoded;
      return next();
    } catch {
      logger.warn("Access token expired or invalid, attempting refresh");
    }
  }

  if (!refreshToken) {
    return next(ApiError.unauthorized("Unauthorized, please login."));
  }

  try {
    const decodedRefresh = verifyRefreshToken(refreshToken);
    if (!decodedRefresh?.userId) {
      return next(ApiError.unauthorized("Invalid refresh token."));
    }

    const refreshTokenHash = generateHashedToken(refreshToken);

    const storedToken = await RefreshToken.findOne({
      userId: decodedRefresh.userId,
      tokenHash: refreshTokenHash
    });

    // Revoke all tokens for this user when reuse is detected (token theft signal)
    if (!storedToken) {
      await RefreshToken.updateMany(
        { userId: decodedRefresh.userId },
        { isRevoked: true, revokedAt: new Date() }
      );
      return next(
        ApiError.unauthorized("Token reuse detected. Please login again.")
      );
    }

    if (storedToken.isRevoked) {
      return next(ApiError.unauthorized("Refresh token revoked."));
    }

    if (storedToken.expiresAt < new Date()) {
      return next(ApiError.unauthorized("Refresh token expired."));
    }

    const user = await User.findById(storedToken.userId);
    if (!user) {
      return next(ApiError.unauthorized("User not found."));
    }

    // Rotate: invalidate old token, issue a new pair
    const newAccessToken = generateAccessToken({
      _id: user._id.toString(),
      role: user.role
    });

    const newRefreshToken = generateRefreshToken(user._id.toString());
    const newRefreshTokenHash = generateHashedToken(newRefreshToken);

    storedToken.isRevoked = true;
    storedToken.revokedAt = new Date();
    storedToken.replacedByTokenHash = newRefreshTokenHash;
    await storedToken.save();

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY)
    });

    setAuthCookies(res, newAccessToken, newRefreshToken);

    req.user = {
      _id: user._id.toString(),
      role: user.role
    };

    return next();
  } catch (err) {
    logger.warn("Refresh token verification failed");
    return next(ApiError.unauthorized("Unauthorized, please login."));
  }
};
