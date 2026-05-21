import { verifyRequest } from "@retardmaxxing/auth";
import { asValue } from "awilix";
import type { MiddlewareHandler } from "hono";
import type { AppBindings } from "../lib/bindings";
import type { HonoVars } from "../trpc/context";

/**
 * HMAC integrity middleware. Mobile clients sign each request with the per-user
 * signingKey returned at signin (stored in SecureStore).
 *
 * Headers:
 *   x-user-id     — claimed user id
 *   x-timestamp   — unix ms (rejected if skew > 5 min)
 *   x-signature   — hex hmac-sha256 of "METHOD\nPATH\nTS\nBODY"
 *
 * Web clients use cookie sessions instead and bypass this middleware.
 *
 * On success, sets `userId` on the DI container so services see it via
 * `ctx.cradle.userId`.
 */
export const integrityMiddleware: MiddlewareHandler<{
  Bindings: AppBindings;
  Variables: HonoVars;
}> = async (c, next) => {
  const container = c.get("container");
  const userId = c.req.header("x-user-id");
  const timestamp = c.req.header("x-timestamp");
  const signature = c.req.header("x-signature");
  if (!userId || !timestamp || !signature) {
    return next();
  }
  const cradle = container.cradle;
  const user = await cradle.usersRepo.findById(userId);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const body = await c.req.raw.clone().text();
  const ok = verifyRequest(
    user.signingKey,
    {
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      body,
      timestamp: Number(timestamp),
    },
    signature
  );
  if (!ok) return c.json({ error: "invalid signature" }, 401);
  container.register({ userId: asValue(user.id) });
  return next();
};
