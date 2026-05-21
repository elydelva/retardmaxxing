import type { AppRouter } from "@retardmaxxing/api/trpc";
import { API_URLS, parseEnv } from "@retardmaxxing/env";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import Constants from "expo-constants";
import superjson from "superjson";
import { buildIntegrityHeaders } from "./integrity";

// Dev: derive Mac LAN IP from Metro hostUri so physical devices can reach
// `wrangler dev`. Other envs: API_URLS map.
const devHost =
  Constants.expoConfig?.hostUri?.split(":")[0] ??
  // @ts-expect-error legacy expoGoConfig fallback
  Constants.expoGoConfig?.debuggerHost?.split(":")[0];

const env = parseEnv(process.env.EXPO_PUBLIC_ENV, "local");
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (env === "local" && devHost ? `http://${devHost}:8787` : API_URLS[env]);

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/trpc`,
      transformer: superjson,
      async fetch(url, options) {
        const method = options?.method ?? "GET";
        const path = new URL(url.toString()).pathname;
        const body = typeof options?.body === "string" ? options.body : "";
        const headers = await buildIntegrityHeaders(method, path, body);
        return fetch(url, {
          ...options,
          headers: { ...(options?.headers ?? {}), ...(headers ?? {}) },
        });
      },
    }),
  ],
});
