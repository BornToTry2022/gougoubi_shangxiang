// Standalone Cloudflare Cron Worker: triggers the app's daily broadcast.
// Uses a SERVICE BINDING (env.MAIN) to call the main worker — Cloudflare blocks
// same-zone worker-to-worker calls over public URLs (error 1042), so we must use
// the binding rather than fetch(SITE_URL). Schedule is in wrangler.toml.
async function callBroadcast(env) {
  // Pass the secret in a header, not the URL, so it never lands in any log.
  const req = new Request("https://main/api/cron/broadcast", {
    method: "POST",
    headers: { "x-cron-key": env.CRON_SECRET ?? "" },
  });
  const res = await env.MAIN.fetch(req);
  return await res.text();
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      callBroadcast(env)
        .then((t) => console.log("broadcast ok:", t.slice(0, 200)))
        .catch((e) => console.error("broadcast failed:", e))
    );
  },
  // Manual trigger (e.g. for testing). The worker injects CRON_SECRET on the
  // caller's behalf, so this MUST require the same secret — otherwise it becomes
  // an open proxy that lets anyone fire a broadcast. The public workers.dev URL is
  // also disabled in wrangler.toml (workers_dev = false) as defense in depth.
  async fetch(req, env) {
    if (!env.CRON_SECRET || req.headers.get("x-cron-key") !== env.CRON_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
    const t = await callBroadcast(env);
    return new Response(t, {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  },
};
