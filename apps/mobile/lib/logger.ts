type Level = "debug" | "info" | "warn" | "error";

const ALLOWED_FIELDS = new Set([
  "userId",
  "kind",
  "channel",
  "status",
  "screen",
  "action",
  "path",
  "durationMs",
  "code",
  "platform",
]);

const REDACT_PATTERNS: RegExp[] = [
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // JWT
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // email
  /\+?\d{1,3}[-\s]?\(?\d{1,4}\)?[-\s.]?\d{3,4}[-\s.]?\d{3,4}/g, // phone
  /\b[A-Fa-f0-9]{40,}\b/g, // long hex (signatures)
];

function redactString(s: string): string {
  let out = s;
  for (const re of REDACT_PATTERNS) out = out.replace(re, "[redacted]");
  return out;
}

function sanitize(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (!ALLOWED_FIELDS.has(k)) continue;
    if (typeof v === "string") out[k] = redactString(v);
    else out[k] = v;
  }
  return out;
}

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  const safe = meta ? sanitize(meta) : undefined;
  // eslint-disable-next-line no-console
  const fn = level === "debug" ? console.log : console[level];
  if (safe) fn(`[${level}] ${msg}`, safe);
  else fn(`[${level}] ${msg}`);
}

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
