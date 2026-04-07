import mongoose from "mongoose";

import {
  LOCK_TIME_MS,
  LOGIN_MAX_ATTEMPTS,
  REACTIVATION_AVAILABLE_AT,
  REFRESH_TOKEN_EXPIRY
} from "@/shared/constants/auth.constants";
import { ApiError } from "@/shared/errors/api-error";
import { hashPassword, verifyPassword } from "@/shared/helpers/auth.helpers";
import { generateHashedToken } from "@/shared/helpers/token.helper";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from "@/shared/utils/jwt";

import type { SignupUserType } from "@/modules/auth/auth.validator";
import RefreshToken from "@/modules/auth/refresh-token.model";
import { sendOtp } from "@/modules/otp/otp.service";
import { deleteFileFromCloudinary } from "@/modules/upload/upload.service";
import User from "@/modules/user/user.model";

import { AccountDeletionTypeConst, OtpTypeConst } from "@/types/enums";
import type { AccountDeletionType, UserRole } from "@/types/enums";

type SessionContext = {
  setAuthCookie?: (accessToken: string, refreshToken: string) => void;
};

export const registerUser = async (
  user: Omit<SignupUserType, "confirmPassword">
) => {
  const { name, email, password, role } = user;

  const existingUser = await User.findOne({ email });
  if (existingUser)
    throw ApiError.conflict("User with this email already exists");

  const hashedPassword = await hashPassword(password);
  return User.create({ name, email, password: hashedPassword, role });
};

export const loginAndSendOtp = async ({
  email,
  password
}: {
  email: string;
  password: string;
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({ email })
      .session(session)
      .select("+password");
    if (!user) {
      await session.abortTransaction();
      throw ApiError.unauthorized("Invalid credentials");
    }

    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      await session.abortTransaction();
      throw ApiError.forbidden(
        `Your account has been locked. Please try again after ${Math.ceil(
          (user.lockUntil.getTime() - Date.now()) / (1000 * 60)
        )} minutes.`
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password || "");

    if (!isPasswordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const lockUntil =
        newAttempts >= LOGIN_MAX_ATTEMPTS
          ? new Date(Date.now() + LOCK_TIME_MS)
          : null;

      await User.updateOne(
        { email },
        { $set: { failedLoginAttempts: newAttempts, lockUntil } }
      );
      await session.abortTransaction();
      throw ApiError.unauthorized("Invalid credentials");
    }

    const otp = await sendOtp({
      email,
      otpType: OtpTypeConst.SIGNIN,
      subject: "Signin"
    });

    await session.commitTransaction();
    return { message: otp.message };
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// Creates tokens and stores refresh token — called after OTP verification
export const handleToken = async (
  user: { _id: string; isEmailVerified: boolean; role: UserRole },
  context: SessionContext
) => {
  if (!user.isEmailVerified) {
    await User.updateOne(
      { _id: user._id },
      { $set: { isEmailVerified: true } }
    );
  }

  const accessToken = generateAccessToken({ _id: user._id, role: user.role });
  const refreshToken = generateRefreshToken(user._id);
  const hashedRefreshToken = generateHashedToken(refreshToken);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashedRefreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY)
  });

  context.setAuthCookie?.(accessToken, refreshToken);

  await User.updateOne(
    { _id: user._id },
    {
      $set: { lastLogin: new Date(), failedLoginAttempts: 0 },
      $unset: { lockUntil: 1 }
    }
  );

  return { message: "OTP verified and user signed in successfully" };
};

export const getUserProfile = (userId: string) => User.findById(userId);

export const refreshTokens = async (
  accessToken: string | null,
  refreshToken: string
) => {
  if (!refreshToken) throw ApiError.unauthorized("Unauthorized, please login.");

  const decodedRefresh = verifyRefreshToken(refreshToken);
  if (!decodedRefresh?.userId)
    throw ApiError.unauthorized("Invalid refresh token.");

  const refreshTokenHash = generateHashedToken(refreshToken);
  const storedToken = await RefreshToken.findOne({
    userId: decodedRefresh.userId,
    tokenHash: refreshTokenHash
  });

  // Reuse detection: revoke all tokens if the hash is unknown
  if (!storedToken) {
    await RefreshToken.updateMany(
      { userId: decodedRefresh.userId },
      { isRevoked: true, revokedAt: new Date() }
    );
    throw ApiError.unauthorized("Token reuse detected. Please login again.");
  }

  if (storedToken.isRevoked)
    throw ApiError.unauthorized("Refresh token revoked.");
  if (storedToken.expiresAt < new Date())
    throw ApiError.unauthorized("Refresh token expired.");

  if (accessToken) {
    const decodedAccess = verifyAccessToken(accessToken);
    if (decodedAccess._id !== decodedRefresh.userId)
      throw ApiError.unauthorized("Token mismatch.");
  }

  const user = await User.findById(decodedRefresh.userId);
  if (!user) throw ApiError.unauthorized("User not found.");

  const newAccessToken = generateAccessToken({
    _id: user._id.toString(),
    role: user.role
  });
  const newRefreshToken = generateRefreshToken(user._id.toString());
  const newRefreshTokenHash = generateHashedToken(newRefreshToken);

  // Rotate: revoke old, issue new
  storedToken.isRevoked = true;
  storedToken.revokedAt = new Date();
  storedToken.replacedByTokenHash = newRefreshTokenHash;
  await storedToken.save();

  await RefreshToken.create({
    userId: user._id,
    tokenHash: newRefreshTokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY)
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = (userId: string) =>
  RefreshToken.updateMany(
    { userId },
    { isRevoked: true, revokedAt: new Date() }
  );

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user)
    throw ApiError.badRequest("If this email is registered, check your inbox.");

  return sendOtp({
    email,
    otpType: OtpTypeConst.PASSWORD_RESET,
    subject: "Password Reset"
  });
};

export const resetPassword = async (email: string, newPassword: string) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw ApiError.unauthorized("Unauthorized access");

  if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
    throw ApiError.forbidden(
      `Your account has been locked. Please try again after ${Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / (1000 * 60)
      )} minutes.`
    );
  }

  if (!user.isEmailVerified)
    throw ApiError.unauthorized("Please verify your email first.");

  const isOldPassword = await verifyPassword(
    newPassword,
    user.password as string
  );
  if (isOldPassword)
    throw ApiError.badRequest("New password should be different!");

  const hashedPassword = await hashPassword(newPassword);
  await User.updateOne(
    { email },
    { $set: { password: hashedPassword, isEmailVerified: true } }
  );

  return { message: "Password reset successfully!" };
};

export const changePassword = async ({
  userId,
  oldPassword,
  newPassword
}: {
  userId: string;
  oldPassword: string;
  newPassword: string;
}) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw ApiError.unauthorized("Unauthorized access");
  if (!user.isEmailVerified)
    throw ApiError.unauthorized("Please verify your email first.");

  const isOldPassword = await verifyPassword(oldPassword, user.password || "");
  if (!isOldPassword) throw ApiError.unauthorized("Invalid credentials");
  if (newPassword === oldPassword)
    throw ApiError.badRequest("New password should be different!");

  const hashedPassword = await hashPassword(newPassword);
  await User.updateOne({ _id: userId }, { $set: { password: hashedPassword } });

  return { message: "Password changed successfully. Please login again!" };
};

export const deleteOrDeactivateAccount = async (
  userId: string,
  type: AccountDeletionType
) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized("Unauthorized access");

  if (type === AccountDeletionTypeConst.SOFT) {
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.reActivateAvailableAt = new Date(
      Date.now() + REACTIVATION_AVAILABLE_AT
    );
    await user.save();
  } else if (type === AccountDeletionTypeConst.HARD) {
    if (user.avatar?.public_id) {
      await deleteFileFromCloudinary([user.avatar.public_id]);
    }
    await User.findOneAndDelete({ _id: userId });
  }
};

export const reactivateAccount = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized("Unauthorized access");

  if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
    throw ApiError.badRequest(
      `Your account has been locked. Please try again after ${Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / (1000 * 60)
      )} minutes.`
    );
  }

  if (!user.isDeleted || !user.deletedAt) {
    throw ApiError.badRequest("Your account is already active!");
  }

  if (
    user.reActivateAvailableAt &&
    new Date(user.reActivateAvailableAt) > new Date()
  ) {
    throw ApiError.forbidden(
      `Your account has been locked. Please try again after ${Math.ceil(
        (user.reActivateAvailableAt.getTime() - Date.now()) / (1000 * 60)
      )} minutes.`
    );
  }

  await User.findOneAndUpdate(
    { _id: userId },
    {
      $set: { isDeleted: false, deletedAt: null, reActivateAvailableAt: null }
    },
    { new: true }
  );
};
