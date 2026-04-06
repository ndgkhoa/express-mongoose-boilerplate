import argon2 from "argon2";

/**
 * Hashes a plaintext password using Argon2id.
 * @param password - The plaintext password to hash.
 * @returns The resulting hash string.
 */
export const hashPassword = async (password: string): Promise<string> =>
  argon2.hash(password);

/**
 * Verifies a plaintext password against an Argon2id hash.
 * @param password - The plaintext password to verify.
 * @param hash - The stored hash to compare against.
 * @returns True if the password matches the hash, false otherwise.
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => argon2.verify(hash, password);
