export const ENVS = ["local", "staging", "production"] as const;
export type Env = (typeof ENVS)[number];

export const isEnv = (v: unknown): v is Env =>
  typeof v === "string" && (ENVS as readonly string[]).includes(v);

export const parseEnv = (v: unknown, fallback: Env = "local"): Env => (isEnv(v) ? v : fallback);

export const API_URLS: Record<Env, string> = {
  local: "http://localhost:8787",
  staging: "https://api-staging.retardmaxxing.workers.dev",
  production: "https://api.retardmaxxing.workers.dev",
};

export const APP_URLS: Record<Env, string> = {
  local: "http://localhost:3000",
  staging: "https://app-staging.retardmaxxing.com",
  production: "https://app.retardmaxxing.com",
};

export const LANDING_URLS: Record<Env, string> = {
  local: "http://localhost:4321",
  staging: "https://staging.retardmaxxing.com",
  production: "https://retardmaxxing.com",
};
