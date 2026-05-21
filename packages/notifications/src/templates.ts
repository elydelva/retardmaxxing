export type NotificationKind =
  | "welcome"
  | "subscription_active"
  | "payment_failed"
  | "trial_ending";

export interface NotificationPayload {
  welcome: { name: string };
  subscription_active: { planName: string };
  payment_failed: { amountCents: number; currency: string };
  trial_ending: { endsAt: Date };
}

export interface RenderedNotification {
  push?: { title: string; body: string; data?: Record<string, unknown> };
  email?: { subject: string; html: string; text: string };
  sms?: { body: string };
}

type Renderer<K extends NotificationKind> = (
  payload: NotificationPayload[K]
) => RenderedNotification;

const templates: { [K in NotificationKind]: Renderer<K> } = {
  welcome: (p) => ({
    push: { title: "Welcome!", body: `Hi ${p.name}, glad you're here.`, data: { kind: "welcome" } },
    email: {
      subject: "Welcome aboard",
      html: `<p>Hi ${p.name}, welcome!</p>`,
      text: `Hi ${p.name}, welcome!`,
    },
    sms: { body: `Welcome, ${p.name}!` },
  }),
  subscription_active: (p) => ({
    push: {
      title: "Subscription active",
      body: `${p.planName} is now active.`,
      data: { kind: "subscription_active" },
    },
    email: {
      subject: `Your ${p.planName} subscription is active`,
      html: `<p>Your <strong>${p.planName}</strong> subscription is now active.</p>`,
      text: `Your ${p.planName} subscription is now active.`,
    },
  }),
  payment_failed: (p) => ({
    push: {
      title: "Payment failed",
      body: `We couldn't charge ${(p.amountCents / 100).toFixed(2)} ${p.currency.toUpperCase()}`,
      data: { kind: "payment_failed" },
    },
    email: {
      subject: "Payment failed",
      html: `<p>Your payment of ${(p.amountCents / 100).toFixed(2)} ${p.currency.toUpperCase()} failed. Please update your method.</p>`,
      text: `Your payment failed. Please update your method.`,
    },
  }),
  trial_ending: (p) => ({
    push: {
      title: "Trial ending soon",
      body: `Your trial ends on ${p.endsAt.toLocaleDateString()}.`,
      data: { kind: "trial_ending" },
    },
    email: {
      subject: "Your trial ends soon",
      html: `<p>Your trial ends on ${p.endsAt.toLocaleDateString()}.</p>`,
      text: `Your trial ends on ${p.endsAt.toLocaleDateString()}.`,
    },
  }),
};

export function renderTemplate<K extends NotificationKind>(
  kind: K,
  payload: NotificationPayload[K]
): RenderedNotification {
  return templates[kind](payload);
}
