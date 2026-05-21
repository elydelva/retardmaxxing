const WEBHOOK_TOLERANCE_SECONDS = 300;
const STRIPE_API_VERSION = "2024-12-18.acacia";
const STRIPE_API_BASE = "https://api.stripe.com/v1";

type FormValue = string | number | boolean | null | undefined | FormObject | FormArray;
interface FormObject {
  [key: string]: FormValue;
}
type FormArray = FormValue[];

function flatten(params: URLSearchParams, prefix: string, value: FormValue): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => flatten(params, `${prefix}[${i}]`, item));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      flatten(params, `${prefix}[${k}]`, v);
    }
    return;
  }
  params.set(prefix, String(value));
}

function encodeForm(body: FormObject): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) flatten(params, k, v);
  return params.toString();
}

async function stripeRequest<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  secretKey: string,
  body?: FormObject,
  idempotencyKey?: string
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Stripe-Version": STRIPE_API_VERSION,
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const init: RequestInit = { method, headers };
  if (body && method !== "GET") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = encodeForm(body);
  }

  const res = await fetch(`${STRIPE_API_BASE}/${path}`, init);
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const errObj = json.error as Record<string, unknown> | undefined;
    const msg = typeof errObj?.message === "string" ? errObj.message : "Stripe API error";
    throw new Error(`Stripe ${res.status}: ${msg}`);
  }
  return json as T;
}

export function stripePost<T = Record<string, unknown>>(
  path: string,
  body: FormObject,
  secretKey: string,
  idempotencyKey?: string
): Promise<T> {
  return stripeRequest<T>("POST", path, secretKey, body, idempotencyKey);
}

export function stripeGet<T = Record<string, unknown>>(
  path: string,
  secretKey: string
): Promise<T> {
  return stripeRequest<T>("GET", path, secretKey);
}

export function stripeDelete<T = Record<string, unknown>>(
  path: string,
  secretKey: string
): Promise<T> {
  return stripeRequest<T>("DELETE", path, secretKey);
}

export async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  now: number = Date.now()
): Promise<boolean> {
  const parts = signatureHeader.split(",");
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Parts = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!tPart || v1Parts.length === 0) return false;

  const timestamp = tPart.slice(2);
  const ageSeconds = Math.floor(now / 1000) - Number(timestamp);
  if (!Number.isFinite(ageSeconds) || Math.abs(ageSeconds) > WEBHOOK_TOLERANCE_SECONDS) {
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  for (const expected of v1Parts) {
    if (computed.length !== expected.length) continue;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (diff === 0) return true;
  }
  return false;
}
