import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { workspaceRoot } from "./env";
import type { Env } from "./types";

interface CacheFile {
  hashes: Record<string, string>;
  lastRunAt: Record<string, string>;
}

function cachePath(env: Env): string {
  const root = workspaceRoot();
  const dir = resolve(root, ".moon/cache/seed");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return resolve(dir, `${env}.json`);
}

export function readCache(env: Env): CacheFile {
  const path = cachePath(env);
  if (!existsSync(path)) return { hashes: {}, lastRunAt: {} };
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as CacheFile;
  } catch {
    return { hashes: {}, lastRunAt: {} };
  }
}

export function writeCache(env: Env, cache: CacheFile): void {
  writeFileSync(cachePath(env), JSON.stringify(cache, null, 2));
}

export function recordRun(env: Env, name: string, hash: string): void {
  const cache = readCache(env);
  cache.hashes[name] = hash;
  cache.lastRunAt[name] = new Date().toISOString();
  writeCache(env, cache);
}

export function clearCache(env: Env, name?: string): void {
  const cache = readCache(env);
  if (name) {
    delete cache.hashes[name];
    delete cache.lastRunAt[name];
  } else {
    cache.hashes = {};
    cache.lastRunAt = {};
  }
  writeCache(env, cache);
}
