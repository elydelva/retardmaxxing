import type { AppRouter } from "@retardmaxxing/api/trpc";
import { API_URLS, parseEnv } from "@retardmaxxing/env";
import type { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;

const env = parseEnv(process.env["NEXT_PUBLIC_ENV"], "local");
const url = `${process.env["NEXT_PUBLIC_API_URL"] ?? API_URLS[env]}/trpc`;

export const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url, transformer: superjson })],
});

export const makeTrpc = (queryClient: QueryClient) =>
  createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient });

export type Trpc = ReturnType<typeof makeTrpc>;
