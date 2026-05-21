import { HttpResponse, http } from "msw";

const API = "http://localhost:8787";

export const handlers = [
  // tRPC health endpoint — base happy-path stub.
  http.get(`${API}/trpc/auth.health`, () =>
    HttpResponse.json({
      result: { data: { json: { ok: true, ts: Date.now() } } },
    })
  ),
];
