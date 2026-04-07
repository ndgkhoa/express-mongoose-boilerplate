import * as z from "zod";

import {
  AccountDeletionTypeConst,
  AuthProviderConst,
  UserRoleConst
} from "@/types/enums";

export const NameSchema = z
  .string({ error: "Name must be a string" })
  .trim()
  .min(3, {
    message: "Name must be at least 3 characters long"
  })
  .max(50, {
    message: "Name must be at most 50 characters long"
  });

export const PasswordSchema = z
  .string({ error: "Password must be a string" })
  .trim()
  .min(6, {
    message: "Password must be at least 6 characters long"
  })
  .max(80, {
    message: "Password must be at most 80 characters long"
  });

export const EmailSchema = z
  .email({ message: "Please enter a valid email address." })
  .max(100, { message: "Email must be no more than 100 characters." });

export const RoleSchema = z
  .enum(UserRoleConst, {
    error: "Role must be either user or admin"
  })
  .default(UserRoleConst.USER);

export const SigninSchema = z.object({
  email: EmailSchema,
  password: z.string({ error: "Password must be a string" }).trim().min(1, {
    message: "Password is required"
  })
});

export const SignupSchema = z
  .object({
    name: NameSchema,
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
    role: RoleSchema
  })
  .refine(
    data => {
      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    }
  );

export const ResetPasswordSchema = z.object({
  email: EmailSchema,
  newPassword: PasswordSchema
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string({ error: "Password must be a string" }).min(1, {
    message: "Old password is required"
  }),
  newPassword: PasswordSchema
});

export const UpdateProfileSchema = z.object({
  name: NameSchema.optional(),
  avatar: z.string().optional()
});

export const GoogleSigninSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  provider: z.enum(AuthProviderConst).default(AuthProviderConst.GOOGLE),
  providerId: z.string({ error: "Provider id must be a string" }).min(1, {
    message: "Provider id is required"
  }),
  avatar: z.string().optional(),
  isEmailVerified: z.boolean().default(false)
});

export const DeleteAccountSchema = z.object({
  userId: z.string({ error: "User id must be a string" }).min(1, {
    message: "User id is required"
  }),
  type: z
    .enum(AccountDeletionTypeConst, {
      error: "Type must be either soft or hard"
    })
    .default(AccountDeletionTypeConst.SOFT)
});

export type SignupUserType = z.infer<typeof SignupSchema>;
export type SigninUserType = z.infer<typeof SigninSchema>;

export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;
export type UpdateProfileType = z.infer<typeof UpdateProfileSchema>;
export type GoogleSigninType = z.infer<typeof GoogleSigninSchema>;
export type DeleteAccountType = z.infer<typeof DeleteAccountSchema>;
