import { NextFunction, Request, Response } from "express";

import { RESET_PASSWORD_TOKEN_EXPIRY } from "@/shared/constants/auth.constants";
import { ApiError } from "@/shared/errors/api-error";
import {
  clearAuthCookies,
  setAuthCookies,
  setCookies
} from "@/shared/helpers/cookie.helper";
import { ApiResponse } from "@/shared/utils/api-response";

import { AuthService } from "@/modules/auth/auth.service";
import type { DeleteAccountType } from "@/modules/auth/auth.validator";
import { OtpService } from "@/modules/otp/otp.service";
import type { VerifyOtpType } from "@/modules/otp/otp.validator";
import {
  deleteFileFromCloudinary,
  uploadToCloudinary
} from "@/modules/upload/upload.service";

/**
 * Verifies an OTP submitted by the user.
 * Sets auth cookies on signin OTP success; sets a reset-password cookie on
 * password-reset OTP success.
 */
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, otpCode, otpType }: VerifyOtpType = req.body;
  if (!email || !otpCode || !otpType) {
    return next(
      ApiError.badRequest("Email, OTP code and OTP type are required")
    );
  }

  const otp = await OtpService.verifyOtp(
    next,
    { email, otpCode, otpType },
    {
      setAuthCookie: (accessToken: string, refreshToken: string) => {
        setAuthCookies(res, accessToken, refreshToken);
      }
    },
    {
      setCookie: (token: string) => {
        setCookies(res, [
          {
            cookie: "hashedResetPasswordToken",
            value: token,
            maxAge: RESET_PASSWORD_TOKEN_EXPIRY
          }
        ]);
      }
    }
  );

  if (!otp) {
    return next(ApiError.server("Failed to verify OTP!"));
  }
  return ApiResponse.ok(res, otp.message || "OTP verified successfully!");
};

/**
 * Registers a new user account.
 * Returns the created user's public fields (name, email, role).
 */
export const signupUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return next(ApiError.badRequest("Name, email and password are required"));
  }

  const user = await AuthService.registerUser(next, {
    name,
    email,
    password,
    role
  });

  if (!user) {
    return next(ApiError.server("Failed to register user!"));
  }

  return ApiResponse.created(res, "User registered successfully", {
    name: user.name,
    email: user.email,
    role: user.role
  });
};

/**
 * Initiates the sign-in flow by validating credentials and sending an OTP.
 * The client must follow up with POST /verify-otp to complete authentication.
 */
export const signinUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(ApiError.badRequest("Email and password are required"));
  }

  const result = await AuthService.loginAndSendOtp(next, { email, password });

  if (!result) {
    return next(ApiError.server("Failed to login!"));
  }

  return ApiResponse.ok(res, result.message || "Otp sent successfully!");
};

/**
 * Returns the authenticated user's profile.
 * Rejects soft-deleted accounts with a 404.
 */
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  if (!userId) {
    return next(ApiError.unauthorized("Unauthorized access"));
  }

  const user = await AuthService.getUserProfile(userId.toString());
  if (!user) {
    return next(ApiError.notFound("User not found"));
  }

  if (user.isDeleted) {
    return next(ApiError.notFound("This account has been deactivated."));
  }

  return ApiResponse.ok(res, "User profile fetched successfully", {
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt
    }
  });
};

/**
 * Updates the authenticated user's name and/or avatar.
 * Deletes the old Cloudinary asset before uploading a new one.
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = req.body;
  const { name } = data;

  if (!req.user?._id) {
    return next(ApiError.unauthorized("Unauthorized access"));
  }

  const user = await AuthService.getUserProfile(req.user?._id.toString());

  if (!user) {
    return next(ApiError.notFound("User not found"));
  }

  if (req?.file && user?.avatar?.public_id) {
    await deleteFileFromCloudinary([user.avatar.public_id]);
  }

  if (req?.file && user?.avatar) {
    const file = await uploadToCloudinary(req.file.buffer, {
      folder: "uploads/files",
      resource_type: "auto"
    });
    user.avatar = {
      public_id: req.file
        ? file.public_id
        : (user?.avatar?.public_id as string),
      url: req.file ? file.url : (user.avatar.url as string),
      size: req.file ? file.size : (user.avatar.size as number)
    };
  }

  if (name) {
    user.name = name;
  }

  await user.save();

  return ApiResponse.Success(res, "Profile updated successfully!", user);
};

/**
 * Rotates the access/refresh token pair using the refresh token from cookies.
 * Issues new cookies on success.
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  const token = await AuthService.refreshTokens(
    next,
    accessToken,
    refreshToken
  );

  if (!token) {
    return next(ApiError.server("Failed to refresh tokens!"));
  }

  const newAccessToken = token.accessToken;
  const newRefreshToken = token.refreshToken;
  setAuthCookies(res, newAccessToken, newRefreshToken);

  return ApiResponse.Success(res, "Tokens refreshed successfully!");
};

/**
 * Logs out the authenticated user by revoking all their refresh tokens.
 * Clears auth cookies from the response.
 */
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?._id;
  if (!userId) {
    return next(ApiError.unauthorized("Unauthorized access"));
  }

  await AuthService.logoutUser(userId.toString());

  clearAuthCookies(res);

  return ApiResponse.Success(res, "Logged out successfully!");
};

/**
 * Sends a password-reset OTP to the given email address.
 * Returns a generic success message regardless of whether the email exists
 * (prevents user enumeration).
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  if (!email) {
    return next(ApiError.badRequest("Email is required!"));
  }

  const result = await AuthService.forgotPassword(next, email);

  if (!result) {
    return next(ApiError.server("Failed to send otp!"));
  }

  return ApiResponse.ok(res, result.message || "Otp sent successfully!");
};

/**
 * Resets the user's password after successful OTP verification.
 * Requires the hashed reset-password token cookie set during OTP verification.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { newPassword, email } = req.body;
  if (!email || !newPassword) {
    return next(ApiError.badRequest("Newpassword and email are required!"));
  }

  const hashedResetPasswordToken = req.cookies?.hashedResetPasswordToken;

  if (!hashedResetPasswordToken) {
    return next(
      ApiError.badRequest("Reset password token not found or expired")
    );
  }

  const result = await AuthService.resetPassword(next, email, newPassword);

  if (!result) {
    return next(ApiError.server("Failed to reset password!"));
  }

  res.clearCookie("hashedResetPasswordToken");
  return ApiResponse.ok(res, result.message || "Password reset successfully!");
};

/**
 * Changes the password for the authenticated user.
 * Verifies the current password before applying the update.
 * Clears auth cookies to force re-login after the change.
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req?.user?._id;

  if (!userId) {
    return next(ApiError.unauthorized("Unauthorized access"));
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(
      ApiError.badRequest("Old password and new password are required")
    );
  }

  const result = await AuthService.changePassword(next, {
    userId: userId.toString(),
    oldPassword,
    newPassword
  });

  if (!result) {
    return next(ApiError.server("Failed to change password!"));
  }

  clearAuthCookies(res);

  return ApiResponse.ok(
    res,
    result.message || "Password changed successfully!"
  );
};

/**
 * Deletes or deactivates the authenticated user's account.
 *   - soft: marks the account as deleted; can be reactivated within the grace period.
 *   - hard: permanently deletes the account and removes associated Cloudinary assets.
 */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, type }: DeleteAccountType = req.body;

  if (!userId || !type) {
    return next(ApiError.badRequest("User id and type are required!"));
  }

  const reqUserId = req?.user?._id;

  if (!reqUserId) {
    return next(ApiError.unauthorized("Unauthorized access"));
  }

  if (userId !== reqUserId) {
    return next(
      ApiError.unauthorized("you are not authorized to perform this action")
    );
  }

  await AuthService.deleteOrDeactiveAccount(next, userId, type);

  if (type === "hard") {
    clearAuthCookies(res);
  }

  return ApiResponse.Success(
    res,
    `Account ${type === "soft" ? "deactivated" : "deleted"} successfully!`
  );
};

/**
 * Reactivates a soft-deleted account if the reactivation window has not expired.
 */
export const reactivateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req?.user?._id;

  if (!userId) {
    return next(ApiError.unauthorized("Unauthorized access"));
  }

  await AuthService.reactivateAccount(next, userId);

  return ApiResponse.Success(res, "Account reactivated successfully!");
};
