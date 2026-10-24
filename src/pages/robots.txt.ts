// robots.txt: a página inteira pode ser rastreada; o sitemap entra quando houver SITE_URL.
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n${site ? `\nSitemap: ${new URL("sitemap.xml", site).href}\n` : ""}`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
