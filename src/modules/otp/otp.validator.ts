import z from "zod";

import { EmailSchema } from "@/modules/auth/auth.validator";

import { OtpTypeConst } from "@/types/enums";

export const RequestOtpSchema = z.object({
  email: EmailSchema,
  otpType: z.enum(OtpTypeConst, { error: "Invalid otp type" })
});

export const VerifyOtpSchema = z.object({
  otpCode: z.string().min(6, "Please enter a valid OTP"),
  email: EmailSchema,
  otpType: z.enum(OtpTypeConst, { error: "Invalid otp type" })
});

export type RequestOtpType = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpType = z.infer<typeof VerifyOtpSchema>;
