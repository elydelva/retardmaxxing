import { initTRPC, TRPCError } from "@trpc/server";
import type { Context as HonoContext } from "hono";
import superjson from "superjson";
import type { AwilixContainer } from "awilix";
import type { AppCradle } from "../container/cradle";
import type { AppBindings } from "../lib/bindings";

export interface HonoVars {
  container: AwilixContainer<AppCradle>;
}

export interface TrpcContext {
  cradle: AppCradle;
  userId: string | null;
  bindings: AppBindings;
  resHeaders: Headers;
}

export function makeContext(
  c: HonoContext<{ Bindings: AppBindings; Variables: HonoVars }>,
  resHeaders: Headers
): TrpcContext {
  const cradle = c.get("container").cradle;
  return {
    cradle,
    userId: cradle.userId,
    bindings: c.env,
    resHeaders,
  };
}

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
