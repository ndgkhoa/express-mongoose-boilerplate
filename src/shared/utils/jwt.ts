import jwt from "jsonwebtoken";

import env from "@/shared/configs/env";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
} from "@/shared/constants/auth.constants";

// Generate a short-lived access token
export const generateAccessToken = (user: {
  _id: string;
  role: "user" | "admin";
}) =>
  jwt.sign({ _id: user._id, role: user.role }, env.JWT_ACCESS_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });

// Generate a long-lived refresh token
export const generateRefreshToken = (userId: string) =>
  jwt.sign({ userId }, env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });

// Verify and decode an access token
export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET!) as { _id: string };

// Verify and decode a refresh token
export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET!) as { userId: string };
