import type { Database } from "@retardmaxxing/database";
import type { Env } from "@retardmaxxing/env";
import type { AppBindings } from "../lib/bindings";
import type { Logger } from "../lib/logger";
import type { AuthService } from "../modules/auth/auth.service";
import type { BillingRepo } from "../modules/billing/billing.repo";
import type { BillingService } from "../modules/billing/billing.service";
import type { NotificationsRepo } from "../modules/notifications/notifications.repo";
import type { NotificationsService } from "../modules/notifications/notifications.service";
import type { UsersRepo } from "../modules/users/users.repo";

export interface AppCradle {
  // request-scoped values
  env: AppBindings;
  environment: Env;
  db: Database;
  logger: Logger;
  userId: string | null;
  // repos
  usersRepo: UsersRepo;
  billingRepo: BillingRepo;
  notificationsRepo: NotificationsRepo;
  // services
  authService: AuthService;
  billingService: BillingService;
  notificationsService: NotificationsService;
}
