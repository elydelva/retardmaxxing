"use client";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";

export default function HomePage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => trpcClient.auth.health.query(),
  });

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-4xl font-bold">retardmaxxing</h1>
        <p className="text-sm opacity-70">
          API:{" "}
          {health.isLoading
            ? "…"
            : health.data?.ok
              ? `ok @ ${new Date(health.data.ts).toLocaleTimeString()}`
              : "down"}
        </p>
      </div>
    </main>
  );
}
