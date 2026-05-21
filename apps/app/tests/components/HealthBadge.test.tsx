import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { server } from "../msw/server";
import { renderWithQueryClient } from "../utils";

function HealthBadge() {
  const q = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const r = await fetch("http://localhost:8787/trpc/auth.health");
      const j = (await r.json()) as { result: { data: { json: { ok: boolean } } } };
      return j.result.data.json;
    },
  });
  if (q.isLoading) return <span>…</span>;
  return <span data-testid="health">{q.data?.ok ? "ok" : "down"}</span>;
}

describe("HealthBadge", () => {
  it("renders ok when API returns ok", async () => {
    renderWithQueryClient(<HealthBadge />);
    await waitFor(() => {
      expect(screen.getByTestId("health")).toHaveTextContent("ok");
    });
  });

  it("renders down when API returns ok=false", async () => {
    server.use(
      http.get("http://localhost:8787/trpc/auth.health", () =>
        HttpResponse.json({ result: { data: { json: { ok: false, ts: 0 } } } })
      )
    );
    renderWithQueryClient(<HealthBadge />);
    await waitFor(() => {
      expect(screen.getByTestId("health")).toHaveTextContent("down");
    });
  });
});
