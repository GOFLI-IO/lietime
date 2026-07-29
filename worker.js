var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = request.headers.get("user-agent") || "";

    // ពិនិត្យនិងទប់ស្កាត់ Bot / Script មិនឱ្យបង្កើត Link តាម API
    if (url.pathname === "/api/create" && request.method === "POST") {
      if (/bot|crawler|spider|curl|wget|python|php/i.test(userAgent)) {
        return new Response("Access Denied for Bots", { status: 403 });
      }

      const body = await request.json();
      
      if (!body.slug || !body.url) {
        return Response.json({ success: false, error: "Missing slug or url" }, { status: 400 });
      }

      await env.DB.prepare(
        "INSERT INTO links (slug, original_url, title, created_at) VALUES (?, ?, ?, ?)"
      ).bind(
        body.slug,
        body.url,
        body.title || "",
        Date.now()
      ).run();
      return Response.json({ success: true });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return fetch("https://gofli-io.github.io/lietime/");
    }

    if (url.pathname === "/api/list") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM links ORDER BY created_at DESC"
      ).all();
      return Response.json(results);
    }

    if (url.pathname === "/api/update" && request.method === "POST") {
      const body = await request.json();
      await env.DB.prepare(
        "UPDATE links SET original_url=?, title=? WHERE slug=?"
      ).bind(
        body.url,
        body.title || "",
        body.slug
      ).run();
      return Response.json({ success: true });
    }

    if (url.pathname.startsWith("/api/delete/")) {
      const slug2 = url.pathname.split("/").pop();
      await env.DB.prepare("DELETE FROM links WHERE slug=?").bind(slug2).run();
      return Response.json({ success: true });
    }

    // ប្រព័ន្ធ Redirect ប្រកបដោយសុវត្ថិភាពខ្ពស់
    const slug = url.pathname.substring(1);
    if (slug && !slug.startsWith("api")) {
      const { results } = await env.DB.prepare(
        "SELECT original_url FROM links WHERE slug=? LIMIT 1"
      ).bind(slug).all();

      if (results && results.length > 0 && results[0].original_url) {
        try {
          const targetUrl = new URL(results[0].original_url);
          if (targetUrl.protocol === "http:" || targetUrl.protocol === "https:") {
            await env.DB.prepare(
              "UPDATE links SET clicks = clicks + 1 WHERE slug = ?"
            ).bind(slug).run();

            return Response.redirect(targetUrl.href, 302);
          }
        } catch (e) {
          // URL មិនត្រឹមត្រូវ
        }
      }
    }

    return new Response("404 Not Found", { status: 404 });
  }
};

export {
  worker_default as default
};
