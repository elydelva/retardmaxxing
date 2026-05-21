#!/usr/bin/env bun
import * as p from "@clack/prompts";
import { Command } from "commander";
import { clearCache, readCache } from "./core/cache";
import { isProductionWriteAllowed, loadDevVars } from "./core/env";
import { makeLogger } from "./core/logger";
import { buildContext } from "./core/platform-proxy";
import { SeederRegistry } from "./core/registry";
import { runSeeders } from "./core/runner";
import type { Env } from "./core/types";
import { ALL_SEEDERS } from "./seeders/_index";

const VERSION = "0.0.1";

function getRegistry(): SeederRegistry {
  const reg = new SeederRegistry();
  reg.registerAll(ALL_SEEDERS);
  return reg;
}

function parseEnv(value: string): Env {
  if (value === "local" || value === "staging" || value === "production") return value;
  throw new Error(`invalid --env: ${value}`);
}

const program = new Command()
  .name("seed")
  .description("retardmaxxing seed CLI — extensible per-environment seeders")
  .version(VERSION);

program
  .command("list")
  .description("list registered seeders")
  .option("--env <env>", "filter by env", "local")
  .option("--tag <tag>", "filter by tag")
  .action((opts) => {
    const reg = getRegistry();
    const env = parseEnv(opts.env);
    const seeders = reg.all().filter((s) => {
      if (s.envs && !s.envs.includes(env)) return false;
      if (opts.tag && !(s.tags ?? []).includes(opts.tag)) return false;
      return true;
    });
    p.intro("Seeders");
    for (const s of seeders) {
      const tags = (s.tags ?? []).join(", ");
      const envs = (s.envs ?? ["local", "staging", "production"]).join("|");
      const deps = (s.dependsOn ?? []).join(", ") || "—";
      console.log(`  • ${s.name}  [${envs}]  tags=${tags}  deps=${deps}`);
      console.log(`      ${s.description}`);
    }
    p.outro(`${seeders.length} seeder(s)`);
  });

program
  .command("run")
  .description("execute seeders for an environment")
  .option("--env <env>", "local | staging | production", "local")
  .option("--remote", "use remote bindings (staging/production)", false)
  .option("--only <names...>", "only run these seeders")
  .option("--tag <tag>", "only run seeders with this tag")
  .option("--dry-run", "plan without writing", false)
  .option("--force", "ignore hash cache, re-run", false)
  .option("--yes", "skip confirmation prompts", false)
  .action(async (opts) => {
    loadDevVars();
    const env = parseEnv(opts.env);
    const log = makeLogger();

    if (!isProductionWriteAllowed(env, opts.remote, opts.yes)) {
      log.error(
        "production remote write blocked. Set SEED_ALLOW_REMOTE=1 and pass --yes to confirm."
      );
      process.exit(1);
    }

    if (env !== "local" && opts.remote && !opts.yes) {
      const ok = await p.confirm({
        message: `About to write to ${env} (remote). Continue?`,
      });
      if (!ok || p.isCancel(ok)) {
        log.warn("aborted");
        process.exit(1);
      }
    }

    const reg = getRegistry();
    const ordered = reg.ordered();
    const { ctx, dispose } = await buildContext({
      env,
      remote: !!opts.remote,
      dryRun: !!opts.dryRun,
      force: !!opts.force,
      log,
    });
    try {
      const result = await runSeeders(ctx, ordered, {
        only: opts.only,
        tag: opts.tag,
        yes: !!opts.yes,
      });
      log.info(
        `done — ran=${result.ran.length} skipped=${result.skipped.length} failed=${result.failed.length}`
      );
      if (result.failed.length > 0) process.exit(1);
    } finally {
      await dispose();
    }
  });

program
  .command("status")
  .description("show last-run status per seeder for an env")
  .option("--env <env>", "local | staging | production", "local")
  .action((opts) => {
    const env = parseEnv(opts.env);
    const cache = readCache(env);
    const reg = getRegistry();
    p.intro(`Seed status — ${env}`);
    for (const s of reg.all()) {
      const last = cache.lastRunAt[s.name] ?? "never";
      console.log(`  • ${s.name.padEnd(20)} ${last}`);
    }
    p.outro("");
  });

program
  .command("reset")
  .description("clear hash cache (re-run seeders next invocation)")
  .option("--env <env>", "local | staging | production", "local")
  .option("--only <name>", "only this seeder")
  .action((opts) => {
    const env = parseEnv(opts.env);
    clearCache(env, opts.only);
    console.log(`cleared cache for ${env}${opts.only ? `:${opts.only}` : ""}`);
  });

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(1);
});
