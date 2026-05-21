export interface Logger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
}

const ALLOWED_FIELDS = new Set([
  "userId",
  "sessionId",
  "kind",
  "channel",
  "status",
  "path",
  "method",
  "code",
  "subId",
  "customer",
  "type",
  "durationMs",
  "expiresAt",
  "email", // redacted below
  "err",
]);

const REDACT_PATTERNS: RegExp[] = [
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // JWT
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // email
  /\b[A-Fa-f0-9]{40,}\b/g, // long hex
  /sk_(live|test)_[A-Za-z0-9]+/g, // stripe secret
  /whsec_[A-Za-z0-9]+/g, // stripe webhook secret
];

function redactString(s: string): string {
  let out = s;
  for (const re of REDACT_PATTERNS) out = out.replace(re, "[redacted]");
  return out;
}

function sanitize(meta: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!meta) return meta;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (!ALLOWED_FIELDS.has(k)) continue;
    out[k] = typeof v === "string" ? redactString(v) : v;
  }
  return out;
}

export const consoleLogger: Logger = {
  info: (msg, meta) => console.log(JSON.stringify({ level: "info", msg, ...(sanitize(meta) ?? {}) })),
  warn: (msg, meta) => console.warn(JSON.stringify({ level: "warn", msg, ...(sanitize(meta) ?? {}) })),
  error: (msg, meta) =>
    console.error(JSON.stringify({ level: "error", msg, ...(sanitize(meta) ?? {}) })),
};

export const noopLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};
