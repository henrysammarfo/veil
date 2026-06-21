/** Long-running proxy for order execute — Vercel rewrites timeout at ~30s; enclave can take ~60s. */
const UPSTREAM = process.env.VEIL_API_UPSTREAM ?? "http://51.103.219.168:8787";
const EXECUTE_TIMEOUT_MS = 120_000;

export const config = {
  maxDuration: 300,
};

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method !== "POST") {
      return Response.json({ error: "method not allowed" }, { status: 405 });
    }

    const body = await req.text();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EXECUTE_TIMEOUT_MS);

    try {
      const upstream = await fetch(`${UPSTREAM}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      clearTimeout(timer);
      const msg = e instanceof Error ? e.message : "execute proxy failed";
      return Response.json({ error: msg }, { status: 502 });
    }
  },
};
