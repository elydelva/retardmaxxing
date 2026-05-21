import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { WelcomeEmail, type WelcomeProps } from "./templates/welcome";
import {
  EmailVerificationEmail,
  type EmailVerificationProps,
} from "./templates/email-verification";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

async function renderTemplate(element: ReactElement, subject: string): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { subject, html, text };
}

export function renderWelcome(props: WelcomeProps): Promise<RenderedEmail> {
  return renderTemplate(WelcomeEmail(props), WelcomeEmail.subject(props));
}

export function renderEmailVerification(
  props: EmailVerificationProps
): Promise<RenderedEmail> {
  return renderTemplate(EmailVerificationEmail(props), EmailVerificationEmail.subject());
}
