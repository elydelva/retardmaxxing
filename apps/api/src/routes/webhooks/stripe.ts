import { verifyStripeSignature } from "@retardmaxxing/billing";
import type { Context } from "hono";
import type { AppBindings } from "../../lib/bindings";
import type { HonoVars } from "../../trpc/context";

export async function stripeWebhookHandler(
  c: Context<{ Bindings: AppBindings; Variables: HonoVars }>
): Promise<Response> {
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.text("missing signature", 400);

  const rawBody = await c.req.text();
  const ok = await verifyStripeSignature(rawBody, signature, c.env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return c.text("invalid signature", 400);

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.text("invalid json", 400);
  }

  const cradle = c.get("container").cradle;
  try {
    const result = await cradle.billingService.handleWebhookEvent(event);
    return c.json({ received: true, ...result });
  } catch (err) {
    cradle.logger.error("stripe.webhook.error", {
      err: err instanceof Error ? err.message : String(err),
    });
    return c.text("handler error", 500);
  }
}
