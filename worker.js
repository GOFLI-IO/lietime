export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const userAgent = request.headers.get("user-agent") || "";

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // API: List links
    if (path === "/api/list" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM links ORDER BY created_at DESC").all();
      return Response.json(results, { headers: corsHeaders });
    }

    // API: Create link
    if (path === "/api/create" && request.method === "POST") {
      try {
        const { slug, url: originalUrl } = await request.json();
        if (!slug || !originalUrl) {
          return Response.json({ success: false, error: "Missing slug or URL" }, { status: 400, headers: corsHeaders });
        }
        const createdAt = Date.now();
        await env.DB.prepare(
          "INSERT INTO links (slug, original_url, created_at, clicks) VALUES (?, ?, ?, 0)"
        ).bind(slug, originalUrl, createdAt).run();
        return Response.json({ success: true }, { headers: corsHeaders });
      } catch (e) {
        return Response.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders });
      }
    }

    // API: Delete link
    if (path.startsWith("/api/delete/") && request.method === "GET") {
      const slug = path.split("/")[3];
      await env.DB.prepare("DELETE FROM links WHERE slug = ?").bind(slug).run();
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    // Redirect & Bot handling
    const slug = path.slice(1);
    if (slug && !path.startsWith("/api/")) {
      // ບ្លុក Scrapers មិនល្អ ប៉ុន្តែអនុញ្ញាត Twitterbot សម្រាប់ Social Preview
      const isBadBot = /python|curl|wget|go-http-client/i.test(userAgent) && !/Twitterbot/i.test(userAgent);
      if (isBadBot) {
        return new Response("Blocked", { status: 403 });
      }

      const link = await env.DB.prepare("SELECT * FROM links WHERE slug = ?").bind(slug).first();
      if (link) {
        ctx.waitUntil(
          env.DB.prepare("UPDATE links SET clicks = COALESCE(clicks, 0) + 1 WHERE slug = ?").bind(slug).run()
        );
        return Response.redirect(link.original_url, 302);
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
