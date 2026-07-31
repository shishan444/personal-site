import { hash, verify } from "@node-rs/argon2";

const HASH_OPTIONS = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  if (hashed.startsWith("$argon2id$CHANGE_ME")) return false;
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

export function validatePasswordInput(password: string): string | null {
  if (password.length < 8) return "密码至少 8 位";
  if (password.length > 128) return "密码最多 128 位";
  return null;
}
