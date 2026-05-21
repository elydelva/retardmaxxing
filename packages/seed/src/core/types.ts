import type { D1Database, KVNamespace, Queue, R2Bucket } from "@cloudflare/workers-types";
import type { Database } from "@retardmaxxing/database";

export type Env = "local" | "staging" | "production";

export interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  step: (msg: string) => void;
}

export interface SeederContext {
  env: Env;
  remote: boolean;
  dryRun: boolean;
  force: boolean;
  db: Database;
  d1: D1Database;
  r2: R2Bucket | null;
  kv: KVNamespace | null;
  jobs: Queue | null;
  log: Logger;
  vars: Record<string, string>;
}

export interface Seeder {
  name: string;
  description: string;
  tags?: string[];
  envs?: Env[];
  dependsOn?: string[];
  hash(ctx: SeederContext): Promise<string>;
  run(ctx: SeederContext): Promise<void>;
}
