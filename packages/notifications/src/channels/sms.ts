export interface SmsMessage {
  to: string;
  from: string;
  body: string;
}

export interface SmsResult {
  ok: boolean;
  sid?: string;
  error?: string;
}

export async function sendTwilioSms(
  msg: SmsMessage,
  accountSid: string,
  authToken: string
): Promise<SmsResult> {
  const params = new URLSearchParams({
    To: msg.to,
    From: msg.from,
    Body: msg.body,
  });
  const auth = btoa(`${accountSid}:${authToken}`);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );
  const json = (await res.json()) as { sid?: string; message?: string };
  if (!res.ok) return { ok: false, error: json.message ?? `HTTP ${res.status}` };
  return json.sid ? { ok: true, sid: json.sid } : { ok: true };
}
