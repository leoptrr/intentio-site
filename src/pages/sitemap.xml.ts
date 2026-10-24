// sitemap.xml com a única página do site. Sem SITE_URL sai vazio (o build já avisa).
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const urls = site ? `<url><loc>${new URL("/", site).href}</loc></url>` : "";
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
