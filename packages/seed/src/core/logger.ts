import * as p from "@clack/prompts";
import type { Logger } from "./types";

export function makeLogger(): Logger {
  return {
    info: (msg) => p.log.info(msg),
    warn: (msg) => p.log.warn(msg),
    error: (msg) => p.log.error(msg),
    step: (msg) => p.log.step(msg),
  };
}
