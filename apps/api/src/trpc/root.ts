import { authRouter } from "../modules/auth/auth.router";
import { billingRouter } from "../modules/billing/billing.router";
import { notificationsRouter } from "../modules/notifications/notifications.router";
import { router } from "./context";

export const appRouter = router({
  auth: authRouter,
  billing: billingRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
