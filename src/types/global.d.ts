export type UserRole = "admin" | "user" | "manager";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        role?: UserRole;
      };
    }
  }
}
