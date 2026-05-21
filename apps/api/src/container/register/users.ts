import { type AwilixContainer, asFunction } from "awilix";
import { createUsersRepo } from "../../modules/users/users.repo";
import type { AppCradle } from "../cradle";

export function registerUsers(c: AwilixContainer<AppCradle>): void {
  c.register({
    usersRepo: asFunction(createUsersRepo).scoped(),
  });
}
