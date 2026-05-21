import { hmac } from "@oslojs/crypto/hmac";
import { SHA256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";

const MAX_SKEW_MS = 5 * 60 * 1000;

export interface SignedRequest {
  method: string;
  path: string;
  body: string;
  timestamp: number;
}

function payload(req: SignedRequest): Uint8Array {
  return new TextEncoder().encode(`${req.method}\n${req.path}\n${req.timestamp}\n${req.body}`);
}

export function signRequest(key: string, req: SignedRequest): string {
  const sig = hmac(SHA256, new TextEncoder().encode(key), payload(req));
  return encodeHexLowerCase(sig);
}

export function verifyRequest(key: string, req: SignedRequest, signature: string): boolean {
  if (Math.abs(Date.now() - req.timestamp) > MAX_SKEW_MS) return false;
  const expected = signRequest(key, req);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export function generateSigningKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeHexLowerCase(bytes);
}
