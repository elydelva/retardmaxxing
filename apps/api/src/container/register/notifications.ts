import { asFunction, type AwilixContainer } from "awilix";
import { createNotificationsRepo } from "../../modules/notifications/notifications.repo";
import { createNotificationsService } from "../../modules/notifications/notifications.service";
import type { AppCradle } from "../cradle";

export function registerNotifications(c: AwilixContainer<AppCradle>): void {
  c.register({
    notificationsRepo: asFunction(createNotificationsRepo).scoped(),
    notificationsService: asFunction(createNotificationsService).scoped(),
  });
}
