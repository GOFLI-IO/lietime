 export default {
      async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/" || url.pathname === "/index.html") {
          return fetch("https://gofli-io.github.io/lietime/");
        }

        if (url.pathname === "/api/list") {
          const { results } = await env.DB.prepare(
            "SELECT * FROM links ORDER BY created_at DESC"
          ).all();
          return Response.json(results);
        }

        if (url.pathname === "/api/create" && request.method === "POST") {
          const body = await request.json();
     await env.DB.prepare(
  "INSERT INTO links (slug, original_url, title, created_at, clicks) VALUES (?, ?, ?, ?, ?)"
).bind(
  body.slug,
  body.url,
  body.title || "",
  Date.now(),
  0
).run();
          return Response.json({ success: true });
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
          const slug = url.pathname.split("/").pop();
          await env.DB.prepare("DELETE FROM links WHERE slug=?")
            .bind(slug)
            .run();
          return Response.json({ success: true });
        }

        const slug = url.pathname.substring(1);

        if (slug && !slug.startsWith("api")) {
          const { results } = await env.DB.prepare(
            "SELECT original_url FROM links WHERE slug=? LIMIT 1"
          ).bind(slug).all();

          if (results.length) {
           await env.DB.prepare(
  "UPDATE links SET clicks = clicks + 1 WHERE slug = ?"
).bind(slug).run();
            return Response.redirect(results[0].original_url, 302);
          }
        }

        return new Response("404 Not Found", { status: 404 });
      }
    }
