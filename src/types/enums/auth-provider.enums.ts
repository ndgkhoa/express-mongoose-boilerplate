export const AuthProviderConst = {
  LOCAL: "local",
  GOOGLE: "google",
  GITHUB: "github"
} as const;

export type AuthProvider =
  (typeof AuthProviderConst)[keyof typeof AuthProviderConst];
