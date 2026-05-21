import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildContainer } from "./container/container";
import type { AppBindings } from "./lib/bindings";
import { integrityMiddleware } from "./middleware/integrity";
import { stripeWebhookHandler } from "./routes/webhooks/stripe";
import { type HonoVars, makeContext } from "./trpc/context";
import { appRouter } from "./trpc/root";

const app = new Hono<{ Bindings: AppBindings; Variables: HonoVars }>();

app.use("*", cors());

app.use("*", async (c, next) => {
  c.set("container", buildContainer(c.env));
  await next();
});

// Webhook routes bypass HMAC (Stripe signs separately)
app.post("/webhooks/stripe", stripeWebhookHandler);

app.use("/trpc/*", integrityMiddleware);

app.get("/", (c) => c.json({ name: "retardmaxxing-api", ok: true }));

app.use("/trpc/*", (c, next) =>
  trpcServer({
    router: appRouter,
    createContext: (_opts) => makeContext(c, new Headers()) as unknown as Record<string, unknown>,
  })(c, next)
);

export default app;
