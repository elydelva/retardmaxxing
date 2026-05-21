import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Env } from "./types";

export function workspaceRoot(): string {
  const fromMoon = process.env.MOON_WORKSPACE_ROOT;
  if (fromMoon) return fromMoon;
  let dir = dirname(fileURLToPath(import.meta.url));
  while (dir !== "/" && !existsSync(resolve(dir, "package.json"))) {
    dir = dirname(dir);
  }
  while (dir !== "/" && !existsSync(resolve(dir, ".moon"))) {
    dir = dirname(dir);
  }
  return dir;
}

export function loadDevVars(root: string = workspaceRoot()): Record<string, string> {
  const path = resolve(root, "apps/api/.dev.vars");
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf-8");
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
    if (process.env[key] === undefined) process.env[key] = val;
  }
  return out;
}

export function isProductionWriteAllowed(env: Env, remote: boolean, yes: boolean): boolean {
  if (env !== "production") return true;
  if (!remote) return true;
  return process.env.SEED_ALLOW_REMOTE === "1" && yes;
}
