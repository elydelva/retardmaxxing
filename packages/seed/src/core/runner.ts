import { readCache, recordRun } from "./cache";
import type { Seeder, SeederContext } from "./types";

export interface RunOptions {
  only?: string[];
  tag?: string;
  yes: boolean;
}

export async function runSeeders(
  ctx: SeederContext,
  ordered: Seeder[],
  opts: RunOptions
): Promise<{ ran: string[]; skipped: string[]; failed: string[] }> {
  const cache = readCache(ctx.env);
  const ran: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const s of ordered) {
    if (opts.only && !opts.only.includes(s.name)) {
      skipped.push(s.name);
      continue;
    }
    if (opts.tag && !(s.tags ?? []).includes(opts.tag)) {
      skipped.push(s.name);
      continue;
    }
    if (s.envs && !s.envs.includes(ctx.env)) {
      skipped.push(s.name);
      continue;
    }

    let hash: string;
    try {
      hash = await s.hash(ctx);
    } catch (e) {
      ctx.log.error(`hash(${s.name}) failed: ${(e as Error).message}`);
      failed.push(s.name);
      continue;
    }

    if (!ctx.force && cache.hashes[s.name] === hash) {
      ctx.log.info(`skip ${s.name} (cached)`);
      skipped.push(s.name);
      continue;
    }

    ctx.log.step(`${ctx.dryRun ? "DRY " : ""}run ${s.name} — ${s.description}`);
    if (ctx.dryRun) {
      skipped.push(s.name);
      continue;
    }

    try {
      await s.run(ctx);
      recordRun(ctx.env, s.name, hash);
      ran.push(s.name);
    } catch (e) {
      ctx.log.error(`${s.name} failed: ${(e as Error).message}`);
      failed.push(s.name);
    }
  }

  return { ran, skipped, failed };
}
