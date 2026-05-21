import { resolve } from "node:path";
import { getPlatformProxy } from "wrangler";
import { createDb } from "@retardmaxxing/database";
import type { Env, Logger, SeederContext } from "./types";
import { workspaceRoot } from "./env";

export interface ProxyOptions {
  env: Env;
  remote: boolean;
  dryRun: boolean;
  force: boolean;
  log: Logger;
}

export async function buildContext(opts: ProxyOptions): Promise<{
  ctx: SeederContext;
  dispose: () => Promise<void>;
}> {
  const root = workspaceRoot();
  const configPath = resolve(root, "apps/api/wrangler.toml");
  const proxy = await getPlatformProxy<{
    DB: import("@cloudflare/workers-types").D1Database;
    OBJECTS?: import("@cloudflare/workers-types").R2Bucket;
    CACHE?: import("@cloudflare/workers-types").KVNamespace;
    JOBS?: import("@cloudflare/workers-types").Queue;
  }>({
    configPath,
    environment: opts.env === "local" ? undefined : opts.env,
    experimental: { remoteBindings: opts.remote },
  });
  const db = createDb(proxy.env.DB);
  const ctx: SeederContext = {
    env: opts.env,
    remote: opts.remote,
    dryRun: opts.dryRun,
    force: opts.force,
    db,
    d1: proxy.env.DB,
    r2: proxy.env.OBJECTS ?? null,
    kv: proxy.env.CACHE ?? null,
    jobs: proxy.env.JOBS ?? null,
    log: opts.log,
    vars: { ...(process.env as Record<string, string>) },
  };
  return { ctx, dispose: () => proxy.dispose() };
}
