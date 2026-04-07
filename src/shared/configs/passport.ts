import { NextFunction, Request, Response } from "express";
import { Profile as GoogleProfile } from "passport-google-oauth20";

import { ApiError } from "@/shared/errors/api-error";
import { setAuthCookies } from "@/shared/helpers/cookie.helper";
import { ApiResponse } from "@/shared/utils/api-response";

import { handleOAuthLogin } from "@/modules/oauth/oauth.service";

// LOGIN WITH GOOGLE
export const googleOAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = req.user as GoogleProfile | undefined;

  if (!data) {
    return next(ApiError.unauthorized("Authenticated failed!"));
  }

  const userInfo = {
    provider: data?.provider,
    providerId: data.id,
    name: data.displayName,
    email: data?.emails && data?.emails[0]?.value,
    isEmailVerified:
      (data?.emails && data?.emails[0]?.verified === true) || true,
    avatar: data.profileUrl || (data.photos && data.photos[0].value)
  };

  const existingUser = await handleOAuthLogin(userInfo, {
    setAuthCookie: (accessToken: string, refreshToken: string) => {
      setAuthCookies(res, accessToken, refreshToken);
    }
  });

  ApiResponse.ok(res, "Signin Successfull", {
    user: {
      _id: existingUser._id.toString(),
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      avatar: existingUser.avatar,
      isEmailVerified: existingUser.isEmailVerified,
      lastLoginAt: existingUser.lastLoginAt,
      provider: existingUser.provider
    }
  });
};
