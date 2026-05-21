import { Apple, Google } from "arctic";

export interface ProviderEnv {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  APPLE_CLIENT_ID: string;
  APPLE_TEAM_ID: string;
  APPLE_KEY_ID: string;
  APPLE_PRIVATE_KEY: string;
  APPLE_REDIRECT_URI: string;
}

export function googleClient(env: ProviderEnv): Google {
  return new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
}

export function appleClient(env: ProviderEnv): Apple {
  return new Apple(
    env.APPLE_CLIENT_ID,
    env.APPLE_TEAM_ID,
    env.APPLE_KEY_ID,
    new TextEncoder().encode(env.APPLE_PRIVATE_KEY),
    env.APPLE_REDIRECT_URI
  );
}
