// Cosmere Journey — Worker "cosmere-feed"
// Legge il feed del blog di Brandon Sanderson e lo restituisce all'app
// con i permessi CORS: il blog non dipende piu' da proxy di terze parti.
// Da incollare in un Worker creato con il modello "Hello World".

const FEED_URL = "https://www.brandonsanderson.com/blogs/blog.atom";
const ALLOWED_ORIGINS = [
  "https://cosmerejourney.proietti-flavio.workers.dev",
];
const TTL_SECONDS = 600; // 10 minuti

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Accept",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return new Response("Metodo non consentito", { status: 405, headers: cors });

    const url = new URL(request.url);
    const fresh = url.searchParams.has("fresh");
    const cache = caches.default;
    const key = new Request(url.origin + "/feed.atom");

    if (!fresh) {
      const hit = await cache.match(key);
      if (hit) return withHeaders(hit, cors);
    }

    let body = null;
    try {
      const upstream = await fetch(FEED_URL, {
        headers: {
          "Accept": "application/atom+xml, application/xml;q=0.9, */*;q=0.8",
          "User-Agent": "CosmereJourney/1.0 (lettore del feed)",
        },
      });
      if (upstream.ok) {
        const text = await upstream.text();
        if (/<(feed|rss)[\s>]/i.test(text)) body = text;
      }
    } catch (_) {
      // rete non disponibile: si prova con la copia in cache qui sotto
    }

    if (body === null) {
      const stale = await cache.match(key);
      if (stale) return withHeaders(stale, cors);
      return new Response("Feed non disponibile", {
        status: 502,
        headers: { ...cors, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    const response = new Response(body, {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
        "Cache-Control": `public, max-age=${TTL_SECONDS}`,
      },
    });
    ctx.waitUntil(cache.put(key, response.clone()));
    return withHeaders(response, cors);
  },
};

function withHeaders(response, extra) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(extra)) r.headers.set(k, v);
  return r;
}
