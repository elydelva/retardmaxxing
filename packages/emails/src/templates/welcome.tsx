import { Section, Text } from "@react-email/components";
import { CTAButton } from "../components/button";
import { EmailShell } from "../components/shell";

export interface WelcomeProps {
  name: string;
  appUrl: string;
}

export function WelcomeEmail({ name, appUrl }: WelcomeProps) {
  return (
    <EmailShell preview={`Welcome to Retardmaxxing, ${name}`}>
      <Text style={greeting}>Hi {name},</Text>
      <Text>Thanks for signing up. Your account is ready.</Text>
      <Section style={ctaWrap}>
        <CTAButton href={appUrl}>Open the app</CTAButton>
      </Section>
      <Text style={muted}>If you didn't sign up, you can ignore this message.</Text>
    </EmailShell>
  );
}

WelcomeEmail.subject = (props: WelcomeProps) => `Welcome to Retardmaxxing, ${props.name}`;

const greeting = { fontSize: "16px", fontWeight: 600, margin: "0 0 12px" };
const ctaWrap = { margin: "24px 0" };
const muted = { color: "#6b7280", fontSize: "13px" };
