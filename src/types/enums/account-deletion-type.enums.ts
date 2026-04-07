export const AccountDeletionTypeConst = {
  SOFT: "soft",
  HARD: "hard"
} as const;

export type AccountDeletionType =
  (typeof AccountDeletionTypeConst)[keyof typeof AccountDeletionTypeConst];
