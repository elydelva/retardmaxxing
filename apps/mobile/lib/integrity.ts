/**
 * HMAC integrity for mobile → API.
 * Server middleware: apps/api/src/middleware/integrity.ts
 *
 * Canonical payload (joined with \n):
 *   METHOD | PATH | TIMESTAMP_MS | BODY
 */
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import { loadSession } from "./secure-store";

export interface IntegrityHeaders {
  "x-user-id": string;
  "x-timestamp": string;
  "x-signature": string;
}

export async function buildIntegrityHeaders(
  method: string,
  path: string,
  body: string
): Promise<IntegrityHeaders | null> {
  const session = await loadSession();
  if (!session) return null;
  const ts = String(Date.now());
  const canonical = [method.toUpperCase(), path, ts, body].join("\n");
  const sig = bytesToHex(hmac(sha256, utf8ToBytes(session.signingKey), utf8ToBytes(canonical)));
  return {
    "x-user-id": session.userId,
    "x-timestamp": ts,
    "x-signature": sig,
  };
}
