export const CookieTypeConst = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  HASHED_RESET_PASSWORD_TOKEN: "hashedResetPasswordToken"
} as const;

export type CookieType = (typeof CookieTypeConst)[keyof typeof CookieTypeConst];
