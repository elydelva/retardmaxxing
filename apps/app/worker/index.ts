/**
 * Cloudflare Worker entry for retardmaxxing-app (vinext app router).
 */
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    return handler.fetch(request);
  },
};
