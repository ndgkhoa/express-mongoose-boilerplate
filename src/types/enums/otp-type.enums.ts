export const OtpTypeConst = {
  SIGNIN: "signin",
  EMAIL_VERIFICATION: "email-verification",
  PASSWORD_RESET: "password-reset",
  PASSWORD_CHANGE: "password-change"
} as const;

export type OtpType = (typeof OtpTypeConst)[keyof typeof OtpTypeConst];
