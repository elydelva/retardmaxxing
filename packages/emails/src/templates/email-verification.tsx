import { Section, Text } from "@react-email/components";
import { CTAButton } from "../components/button";
import { EmailShell } from "../components/shell";

export interface EmailVerificationProps {
  name: string;
  verifyUrl: string;
  expiresInHours: number;
}

export function EmailVerificationEmail({
  name,
  verifyUrl,
  expiresInHours,
}: EmailVerificationProps) {
  return (
    <EmailShell preview="Confirm your email to activate your account">
      <Text style={greeting}>Hi {name},</Text>
      <Text>Confirm your email address to finish setting up your account.</Text>
      <Section style={ctaWrap}>
        <CTAButton href={verifyUrl}>Confirm my email</CTAButton>
      </Section>
      <Text style={muted}>
        This link expires in <strong>{expiresInHours} hours</strong>. If you didn't sign up,
        ignore this message.
      </Text>
    </EmailShell>
  );
}

EmailVerificationEmail.subject = () => "Confirm your email — Retardmaxxing";

const greeting = { fontSize: "16px", fontWeight: 600, margin: "0 0 12px" };
const ctaWrap = { margin: "24px 0" };
const muted = { color: "#6b7280", fontSize: "13px" };
