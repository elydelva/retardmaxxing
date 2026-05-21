import { type AwilixContainer, asFunction } from "awilix";
import { createBillingRepo } from "../../modules/billing/billing.repo";
import { createBillingService } from "../../modules/billing/billing.service";
import type { AppCradle } from "../cradle";

export function registerBilling(c: AwilixContainer<AppCradle>): void {
  c.register({
    billingRepo: asFunction(createBillingRepo).scoped(),
    billingService: asFunction(createBillingService).scoped(),
  });
}
