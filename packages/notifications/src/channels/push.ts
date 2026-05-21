export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

export interface PushResult {
  ok: boolean;
  invalidTokens: string[];
  raw?: unknown;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

export async function sendExpoPush(
  messages: PushMessage[],
  accessToken?: string
): Promise<PushResult> {
  if (messages.length === 0) return { ok: true, invalidTokens: [] };
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    return { ok: false, invalidTokens: [], raw: await res.text() };
  }
  const json = (await res.json()) as { data?: ExpoTicket[] };
  const tickets = json.data ?? [];
  const invalidTokens: string[] = [];
  tickets.forEach((t, i) => {
    if (
      t.status === "error" &&
      (t.details?.error === "DeviceNotRegistered" || t.details?.error === "InvalidCredentials")
    ) {
      const token = messages[i]?.to;
      if (token) invalidTokens.push(token);
    }
  });
  return { ok: true, invalidTokens, raw: json };
}
