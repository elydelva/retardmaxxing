import { asFunction, type AwilixContainer } from "awilix";
import { createAuthService } from "../../modules/auth/auth.service";
import type { AppCradle } from "../cradle";

export function registerAuth(c: AwilixContainer<AppCradle>): void {
  c.register({
    authService: asFunction(createAuthService).scoped(),
  });
}
