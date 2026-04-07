export const UserRoleConst = {
  USER: "user",
  ADMIN: "admin"
} as const;

export type UserRole = (typeof UserRoleConst)[keyof typeof UserRoleConst];
