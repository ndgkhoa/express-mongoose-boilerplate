import { Request, Response } from "express";

import { RESET_PASSWORD_TOKEN_EXPIRY } from "@/shared/constants/auth.constants";
import { ApiError } from "@/shared/errors/api-error";
import {
  clearAuthCookies,
  setAuthCookies,
  setCookies
} from "@/shared/helpers/cookie.helper";
import { ApiResponse } from "@/shared/utils/api-response";

import * as authService from "@/modules/auth/auth.service";
import type { DeleteAccountType } from "@/modules/auth/auth.validator";
import { verifyOtp as verifyOtpService } from "@/modules/otp/otp.service";
import type { VerifyOtpType } from "@/modules/otp/otp.validator";
import {
  deleteFileFromCloudinary,
  uploadToCloudinary
} from "@/modules/upload/upload.service";

import { AccountDeletionTypeConst, CookieTypeConst } from "@/types/enums";

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otpCode, otpType }: VerifyOtpType = req.body;

  const result = await verifyOtpService(
    { email, otpCode, otpType },
    {
      setAuthCookie: (accessToken, refreshToken) =>
        setAuthCookies(res, accessToken, refreshToken)
    },
    {
      setCookie: token =>
        setCookies(res, [
          {
            cookie: CookieTypeConst.HASHED_RESET_PASSWORD_TOKEN,
            value: token,
            maxAge: RESET_PASSWORD_TOKEN_EXPIRY
          }
        ])
    }
  );

  return ApiResponse.ok(
    res,
    (result as { message?: string }).message || "OTP verified successfully!"
  );
};

export const signupUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const user = await authService.registerUser({ name, email, password, role });

  return ApiResponse.created(res, "User registered successfully", {
    name: user.name,
    email: user.email,
    role: user.role
  });
};

export const signinUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginAndSendOtp({ email, password });

  return ApiResponse.ok(res, result.message || "OTP sent successfully!");
};

export const getUserProfile = async (req: Request, res: Response) => {
  if (!req.user?._id) throw ApiError.unauthorized("Unauthorized access");

  const user = await authService.getUserProfile(req.user._id);
  if (!user) throw ApiError.notFound("User not found");
  if (user.isDeleted)
    throw ApiError.notFound("This account has been deactivated.");

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

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.user?._id) throw ApiError.unauthorized("Unauthorized access");

  const { name } = req.body;
  const user = await authService.getUserProfile(req.user._id);
  if (!user) throw ApiError.notFound("User not found");

  if (req.file && user.avatar?.public_id) {
    await deleteFileFromCloudinary([user.avatar.public_id]);
  }

  if (req.file) {
    const file = await uploadToCloudinary(req.file.buffer, {
      folder: "uploads/files",
      resource_type: "auto"
    });
    user.avatar = { public_id: file.public_id, url: file.url, size: file.size };
  }

  if (name) user.name = name;
  await user.save();

  return ApiResponse.Success(res, "Profile updated successfully!", user);
};

export const refreshToken = async (req: Request, res: Response) => {
  const accessToken = req.cookies?.[CookieTypeConst.ACCESS_TOKEN] ?? null;
  const refreshToken = req.cookies?.[CookieTypeConst.REFRESH_TOKEN];

  const token = await authService.refreshTokens(accessToken, refreshToken);
  setAuthCookies(res, token.accessToken, token.refreshToken);

  return ApiResponse.Success(res, "Tokens refreshed successfully!");
};

export const logoutUser = async (req: Request, res: Response) => {
  if (!req.user?._id) throw ApiError.unauthorized("Unauthorized access");

  await authService.logoutUser(req.user._id);
  clearAuthCookies(res);

  return ApiResponse.Success(res, "Logged out successfully!");
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);

  return ApiResponse.ok(res, result.message || "OTP sent successfully!");
};

export const resetPassword = async (req: Request, res: Response) => {
  const { newPassword, email } = req.body;

  const hashedResetPasswordToken =
    req.cookies?.[CookieTypeConst.HASHED_RESET_PASSWORD_TOKEN];
  if (!hashedResetPasswordToken) {
    throw ApiError.badRequest("Reset password token not found or expired");
  }

  const result = await authService.resetPassword(email, newPassword);
  res.clearCookie(CookieTypeConst.HASHED_RESET_PASSWORD_TOKEN);

  return ApiResponse.ok(res, result.message || "Password reset successfully!");
};

export const changePassword = async (req: Request, res: Response) => {
  if (!req.user?._id) throw ApiError.unauthorized("Unauthorized access");

  const { oldPassword, newPassword } = req.body;
  const result = await authService.changePassword({
    userId: req.user._id,
    oldPassword,
    newPassword
  });

  clearAuthCookies(res);
  return ApiResponse.ok(
    res,
    result.message || "Password changed successfully!"
  );
};

export const deleteAccount = async (req: Request, res: Response) => {
  const { userId, type }: DeleteAccountType = req.body;

  if (!req.user?._id) throw ApiError.unauthorized("Unauthorized access");
  if (userId !== req.user._id) {
    throw ApiError.unauthorized(
      "You are not authorized to perform this action"
    );
  }

  await authService.deleteOrDeactivateAccount(userId, type);

  if (type === AccountDeletionTypeConst.HARD) clearAuthCookies(res);

  return ApiResponse.Success(
    res,
    `Account ${type === AccountDeletionTypeConst.SOFT ? "deactivated" : "deleted"} successfully!`
  );
};

export const reactivateAccount = async (req: Request, res: Response) => {
  if (!req.user?._id) throw ApiError.unauthorized("Unauthorized access");

  await authService.reactivateAccount(req.user._id);
  return ApiResponse.Success(res, "Account reactivated successfully!");
};
