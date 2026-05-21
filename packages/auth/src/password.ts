/**
 * Password hashing — PBKDF2 (SHA-256, 210k iterations) via WebCrypto.
 * Workers-safe (no Node crypto, no native bindings). Output format:
 *
 *   pbkdf2$<iterations>$<saltB64>$<hashB64>
 *
 * 210,000 iterations is OWASP 2023 guidance for PBKDF2-SHA256.
 */
import { decodeBase64, encodeBase64 } from "@oslojs/encoding";

const ITERATIONS = 210_000;
const KEY_LEN = 32;
const SALT_LEN = 16;
const ALGO = "PBKDF2";
const HASH = "SHA-256";

async function deriveBits(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: ALGO },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: ALGO, hash: HASH, salt, iterations },
    key,
    KEY_LEN * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_LEN);
  crypto.getRandomValues(salt);
  const hash = await deriveBits(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${encodeBase64(salt)}$${encodeBase64(hash)}`;
}

export async function verifyPassword(stored: string, candidate: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const salt = decodeBase64(parts[2] ?? "");
  const expected = decodeBase64(parts[3] ?? "");
  const actual = await deriveBits(candidate, salt, iterations);
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < actual.length; i++) mismatch |= (actual[i] ?? 0) ^ (expected[i] ?? 0);
  return mismatch === 0;
}
