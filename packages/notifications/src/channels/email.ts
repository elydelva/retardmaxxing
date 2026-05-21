export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const RESEND_URL = "https://api.resend.com/emails";

export async function sendResendEmail(msg: EmailMessage, apiKey: string): Promise<EmailResult> {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });
  const json = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) return { ok: false, error: json.message ?? `HTTP ${res.status}` };
  return json.id ? { ok: true, id: json.id } : { ok: true };
}
