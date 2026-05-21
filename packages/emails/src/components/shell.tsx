import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailShellProps {
  preview: string;
  children: ReactNode;
  supportEmail?: string;
  brand?: string;
  lang?: string;
}

const SUPPORT_EMAIL_DEFAULT = "support@retardmaxxing.com";
const BRAND_DEFAULT = "Retardmaxxing";

export function EmailShell({
  preview,
  children,
  supportEmail,
  brand = BRAND_DEFAULT,
  lang = "en",
}: EmailShellProps) {
  const support = supportEmail ?? SUPPORT_EMAIL_DEFAULT;
  return (
    <Html lang={lang}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brandStyle}>{brand}</Text>
          </Section>
          <Section style={content}>{children}</Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Email{" "}
              <Link href={`mailto:${support}`} style={footerLink}>
                {support}
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f6f4",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: "32px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const header = { paddingBottom: "16px" };

const brandStyle = {
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  margin: 0,
};

const content = {
  color: "#0f172a",
  fontSize: "15px",
  lineHeight: "1.6",
};

const hr = {
  border: "none",
  borderTop: "1px solid #e5e7eb",
  margin: "32px 0 16px",
};

const footer = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.5",
};

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "4px 0",
};

const footerLink = {
  color: "#0f172a",
  textDecoration: "underline",
};
