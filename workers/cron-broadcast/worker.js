// Standalone Cloudflare Cron Worker: triggers the app's daily broadcast.
// Uses a SERVICE BINDING (env.MAIN) to call the main worker — Cloudflare blocks
// same-zone worker-to-worker calls over public URLs (error 1042), so we must use
// the binding rather than fetch(SITE_URL). Schedule is in wrangler.toml.
async function callBroadcast(env) {
  const req = new Request(
    `https://main/api/cron/broadcast?key=${env.CRON_SECRET}`,
    { method: "POST" }
  );
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
  // manual trigger for testing: open the worker URL
  async fetch(_req, env) {
    const t = await callBroadcast(env);
    return new Response(t, {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  },
};
