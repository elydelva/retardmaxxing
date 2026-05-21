import { log } from "./logger";

export function reportEngagement(kind: string, meta?: Record<string, unknown>): void {
  log.info("engagement", { kind, ...(meta ?? {}) });
}
