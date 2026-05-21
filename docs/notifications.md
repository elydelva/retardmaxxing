# Notifications — push, email, SMS

Single unified package (`packages/notifications`) with three channels. Dispatch through `notificationsService.dispatch(userId, kind, payload, options?)`.

## Channels

| Channel | Provider | Required env |
|---|---|---|
| Push | Expo Push API (HTTPS, no SDK) | `EXPO_ACCESS_TOKEN` (optional) |
| Email | Resend | `RESEND_API_KEY`, `EMAIL_FROM` |
| SMS | Twilio (extensible) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` |

## Templates

Defined in `packages/notifications/src/templates.ts`. Each template returns `{ push?, email?, sms? }`. Add a kind by extending `NotificationKind` + `NotificationPayload` + the `templates` registry.

## Preference filtering

`notification_preferences` is keyed by `userId`. Defaults: push on, email on, sms off. `perKind` lets users mute one channel for one kind (e.g. push for `payment_failed` only).

The service checks `perKind[kind][channel]` first, then falls back to the global toggle, then to the channel default.

## Mobile push token lifecycle

- `apps/mobile/lib/push.ts → registerForPushNotifications()` — call on app launch / after login. Asks for permission, gets Expo token, registers via tRPC.
- `revokePushOnLogout(token)` — call on sign-out.
- Invalid tokens (DeviceNotRegistered) are auto-revoked server-side when Expo Push returns the error.

## Deep-link routing

`expo-notifications` response handler reads `data.kind` from the payload and routes accordingly:

```ts
onNotificationResponse((kind, data) => {
  if (kind === "subscription_active") router.push("/(tabs)/billing");
});
```

## Adding a new kind

1. Extend `NotificationKind` and `NotificationPayload` in `packages/notifications/src/templates.ts`.
2. Add a renderer in the `templates` object.
3. Call from anywhere: `await notificationsService.dispatch(userId, "trial_ending", { endsAt })`.
