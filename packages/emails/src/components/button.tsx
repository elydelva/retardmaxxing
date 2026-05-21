import { Button as ReButton } from "@react-email/components";

interface CTAButtonProps {
  href: string;
  children: string;
}

export function CTAButton({ href, children }: CTAButtonProps) {
  return (
    <ReButton href={href} style={button}>
      {children}
    </ReButton>
  );
}

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};
