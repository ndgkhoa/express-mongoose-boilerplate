import { RESET_PASSWORD_TOKEN_EXPIRY } from "@/shared/constants/auth.constants";
import {
  NEXT_OTP_DELAY,
  OTP_CODE_LENGTH,
  OTP_EXPIRES_IN,
  OTP_MAX_ATTEMPTS
} from "@/shared/constants/otp.constants";
import { ApiError } from "@/shared/errors/api-error";
import {
  generateHashedToken,
  generateOTP
} from "@/shared/helpers/token.helper";
import { logger } from "@/shared/utils/logger";
import { sendEmail } from "@/shared/utils/send-mail";

import { handleToken } from "@/modules/auth/auth.service";
import Otp from "@/modules/otp/otp.model";
import User from "@/modules/user/user.model";

import { OtpTypeConst } from "@/types/enums";
import type { OtpType } from "@/types/enums";

type SendOtpPayload = {
  email: string;
  otpType: OtpType;
  subject: string;
};

type VerifyOtpPayload = {
  email: string;
  otpCode: string;
  otpType: OtpType;
};

type VerifyOtpContext = {
  setAuthCookie?: (accessToken: string, refreshToken: string) => void;
};

type ResetPasswordContext = {
  setCookie?: (token: string) => void;
};

export const sendOtp = async (payload: SendOtpPayload) => {
  const { email, otpType, subject } = payload;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.badRequest("Invalid request");
  if (user.lockUntil && user.lockUntil > new Date())
    throw ApiError.badRequest("Account locked");

  const existingOtp = await Otp.findOne({ email, type: otpType });
  if (existingOtp && existingOtp.nextResendAllowedAt > new Date()) {
    const remainingSec = Math.ceil(
      (existingOtp.nextResendAllowedAt.getTime() - Date.now()) / 1000
    );
    throw ApiError.badRequest(
      `Please wait ${remainingSec} seconds before requesting another OTP`
    );
  }

  const otp = generateOTP(OTP_CODE_LENGTH, OTP_EXPIRES_IN);
  logger.info(
    `Sending OTP to ${email} with type ${otpType} and code ${otp.code}`
  );

  await sendEmail({
    email,
    subject,
    html: `<p>Your OTP for ${otpType}: ${otp.code}</p>`
  });

  await Otp.create({
    email,
    type: otpType,
    otpHashCode: otp.hashCode,
    attempts: 0,
    isUsed: false,
    expiresAt: otp.expiresAt,
    nextResendAllowedAt: new Date(Date.now() + NEXT_OTP_DELAY)
  });

  return { message: `OTP sent to ${email} successfully` };
};

// Generates a hashed reset token and sets it as a short-lived cookie
const handlePasswordReset = (
  user: { _id: string },
  context: ResetPasswordContext
) => {
  const hashedResetPasswordToken = generateHashedToken(user._id.toString());
  context.setCookie?.(hashedResetPasswordToken);
  return {
    hashedResetPasswordToken,
    resetPasswordExpiry: new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRY)
  };
};

export const verifyOtp = async (
  payload: VerifyOtpPayload,
  context: VerifyOtpContext,
  resetPasswordContext: ResetPasswordContext
): Promise<unknown> => {
  const { email, otpCode, otpType } = payload;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.unauthorized("Unauthorized, Please login first.");

  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw ApiError.badRequest(
      `Your account has been locked. Try again in ${minutes} minutes.`
    );
  }

  const otp = await Otp.findOne({
    email,
    type: otpType,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  })
    .sort({ createdAt: -1 })
    .select("+otpHashCode");

  if (!otp) throw ApiError.badRequest("Invalid or expired OTP");

  if (otp.attempts >= (otp.maxAttempts || OTP_MAX_ATTEMPTS)) {
    throw ApiError.badRequest("Maximum OTP attempts reached");
  }

  const hashedOtp = generateHashedToken(String(otpCode));
  if (otp.otpHashCode !== hashedOtp) {
    await Otp.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
    throw ApiError.badRequest("Invalid OTP code");
  }

  otp.isUsed = true;
  await otp.save();

  if (otp.type === OtpTypeConst.SIGNIN) {
    return handleToken(
      {
        _id: user._id.toString(),
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      context
    );
  }

  if (otp.type === OtpTypeConst.PASSWORD_RESET) {
    return handlePasswordReset(
      { _id: user._id.toString() },
      resetPasswordContext
    );
  }

  await Otp.deleteMany({ expiresAt: { $lt: new Date() }, isUsed: true });
  return { message: "OTP verified successfully" };
};
