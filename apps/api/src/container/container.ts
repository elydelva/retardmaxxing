import { createDb } from "@retardmaxxing/database";
import { parseEnv } from "@retardmaxxing/env";
import { type AwilixContainer, asValue, createContainer, InjectionMode } from "awilix";
import type { AppBindings } from "../lib/bindings";
import { consoleLogger } from "../lib/logger";
import type { AppCradle } from "./cradle";
import { registerAuth } from "./register/auth";
import { registerBilling } from "./register/billing";
import { registerNotifications } from "./register/notifications";
import { registerUsers } from "./register/users";

export function buildContainer(env: AppBindings): AwilixContainer<AppCradle> {
  const c = createContainer<AppCradle>({ injectionMode: InjectionMode.PROXY });

  c.register({
    env: asValue(env),
    environment: asValue(parseEnv(env.ENVIRONMENT, "local")),
    db: asValue(createDb(env.DB)),
    logger: asValue(consoleLogger),
    userId: asValue<string | null>(null),
  });

  registerUsers(c);
  registerAuth(c);
  registerBilling(c);
  registerNotifications(c);

  return c;
}
