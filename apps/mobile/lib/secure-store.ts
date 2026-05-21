import * as SecureStore from "expo-secure-store";

const KEY_USER_ID = "retardmaxxing.user_id";
const KEY_SESSION_TOKEN = "retardmaxxing.session_token";
const KEY_SIGNING_KEY = "retardmaxxing.signing_key";

export interface StoredSession {
  userId: string;
  sessionToken: string;
  signingKey: string;
}

export async function saveSession(s: StoredSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEY_USER_ID, s.userId),
    SecureStore.setItemAsync(KEY_SESSION_TOKEN, s.sessionToken),
    SecureStore.setItemAsync(KEY_SIGNING_KEY, s.signingKey),
  ]);
}

export async function loadSession(): Promise<StoredSession | null> {
  const [userId, sessionToken, signingKey] = await Promise.all([
    SecureStore.getItemAsync(KEY_USER_ID),
    SecureStore.getItemAsync(KEY_SESSION_TOKEN),
    SecureStore.getItemAsync(KEY_SIGNING_KEY),
  ]);
  if (!userId || !sessionToken || !signingKey) return null;
  return { userId, sessionToken, signingKey };
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_USER_ID),
    SecureStore.deleteItemAsync(KEY_SESSION_TOKEN),
    SecureStore.deleteItemAsync(KEY_SIGNING_KEY),
  ]);
}
