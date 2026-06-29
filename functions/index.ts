// functions/index.ts — TLA backend entrypoint.
// All app state (users, posts, likes, comments, images) lives in a single
// global AppState Durable Object. The Worker just forwards requests to it.

export { AppState } from "./app-state";

type Env = { DO: Fetcher };

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    if (url.pathname === "/ping") {
      return Response.json({ ok: true, now: new Date().toISOString() }, { headers: CORS });
    }

    // Forward everything else to the singleton AppState DO.
    const wrapped = new Request(request.url, request);
    wrapped.headers.set("X-Rork-DO-Class", "AppState");
    wrapped.headers.set("X-Rork-DO-Id", "global");
    const response = await env.DO.fetch(wrapped);

    // Re-attach CORS headers to the DO response.
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
} satisfies ExportedHandler<Env>;
