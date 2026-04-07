import mongoose, { Document, Model, Schema } from "mongoose";

import {
  OTP_EXPIRES_IN,
  OTP_MAX_ATTEMPTS
} from "@/shared/constants/otp.constants";

import { OtpType, OtpTypeConst } from "@/types/enums";

export interface IOtp extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otpHashCode: string;
  nextResendAllowedAt: Date;
  type: OtpType;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true
    },
    otpHashCode: {
      type: String,
      required: [true, "OTP hash code is required"],
      select: false // Never return OTP hash code in queries by default
    },
    nextResendAllowedAt: {
      type: Date,
      required: [true, "Next resend allowed at is required"]
    },
    type: {
      type: String,
      enum: Object.values(OtpTypeConst),
      required: [true, "OTP type is required"]
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration time is required"]
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: OTP_MAX_ATTEMPTS // Prevent brute force attacks
    }
  },
  {
    timestamps: true
  }
);

otpSchema.index({ email: 1, type: 1 });
otpSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: OTP_EXPIRES_IN / 1000 }
);

const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", otpSchema);

export default Otp;
