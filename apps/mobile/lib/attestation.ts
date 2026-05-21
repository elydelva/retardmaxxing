import { Platform } from "react-native";
import { log } from "./logger";

export interface AttestationResult {
  kind: "ios" | "android" | "dev";
  token?: string;
}

/**
 * Best-effort device attestation. Falls back to "dev" on simulator/emulator
 * so local development isn't blocked. Wire @expo/app-integrity in production.
 */
export async function attestDevice(): Promise<AttestationResult> {
  try {
    if (Platform.OS === "ios") {
      // const integrity = await import("@expo/app-integrity");
      // const token = await integrity.attest();
      // return { kind: "ios", token };
      return { kind: "dev" };
    }
    if (Platform.OS === "android") {
      // Play Integrity API hookup here
      return { kind: "dev" };
    }
  } catch (err) {
    log.warn("attestation.failed", { code: String(err) });
  }
  return { kind: "dev" };
}
