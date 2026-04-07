import { Response } from "express";

import env from "@/shared/configs/env";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
} from "@/shared/constants/auth.constants";

import { CookieTypeConst } from "@/types/enums";

const isProduction = env.NODE_ENV === "production";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/"
};

type Cookie = {
  cookie: string;
  value: string;
  maxAge: number;
};

export const setCookies = (res: Response, cookies: Cookie[]) => {
  cookies.forEach(({ cookie, value, maxAge }) => {
    res.cookie(cookie, value, { ...COOKIE_OPTIONS, maxAge });
  });
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  setCookies(res, [
    {
      cookie: CookieTypeConst.ACCESS_TOKEN,
      value: accessToken,
      maxAge: ACCESS_TOKEN_EXPIRY
    },
    {
      cookie: CookieTypeConst.REFRESH_TOKEN,
      value: refreshToken,
      maxAge: REFRESH_TOKEN_EXPIRY
    }
  ]);
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(CookieTypeConst.ACCESS_TOKEN, COOKIE_OPTIONS);
  res.clearCookie(CookieTypeConst.REFRESH_TOKEN, COOKIE_OPTIONS);
};

export const clearCookie = (res: Response, cookie: string = "sid") => {
  res.clearCookie(cookie, COOKIE_OPTIONS);
};
