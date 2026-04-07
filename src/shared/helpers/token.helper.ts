import crypto from "node:crypto";

export const generateOTP = (length: number = 6, ttlMinutes: number = 5) => {
  const code = crypto
    .randomInt(0, Math.pow(10, length))
    .toString()
    .padStart(length, "0");
  const hashCode = crypto
    .createHash("sha256")
    .update(String(code))
    .digest("hex");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  return { code, hashCode, expiresAt };
};

export const verifyOTP = (code: string, hashCode: string): boolean => {
  const validCode = crypto
    .createHash("sha256")
    .update(String(code))
    .digest("hex");
  return validCode === hashCode;
};

export const hashOTP = (otp: string): string =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

export const generateSecureToken = (length: number = 32): string =>
  crypto.randomBytes(length).toString("hex");

export const generateHashedToken = (token: string): string =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

export const generateTokenAndHashedToken = (id: string) => {
  const cryptoSecret = process.env.CRYPTO_SECRET! || "secret";
  const token = crypto
    .createHmac("sha256", cryptoSecret)
    .update(String(id))
    .digest("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
  return { token, hashedToken };
};

export const verifyHashedToken = (
  token: string,
  hashedToken: string
): boolean =>
  crypto.createHash("sha256").update(String(token)).digest("hex") ===
  hashedToken;

export const generateUUID = (): string => crypto.randomUUID();

export const generateAlphanumericToken = (length: number = 32): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomBytes = crypto.randomBytes(length);
  let token = "";

  for (let i = 0; i < length; i++) {
    token += chars[randomBytes[i] % chars.length];
  }

  return token;
};

export const generateURLSafeToken = (length: number = 32): string =>
  crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

export const generateNumericCode = (length: number = 6): string => {
  const digits = "0123456789";
  const randomBytes = crypto.randomBytes(length);
  let code = "";

  for (let i = 0; i < length; i++) {
    code += digits[randomBytes[i] % 10];
  }

  return code;
};
