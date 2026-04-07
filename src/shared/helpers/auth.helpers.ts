import argon2 from "argon2";

export const hashPassword = async (password: string): Promise<string> =>
  argon2.hash(password);

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => argon2.verify(hash, password);
