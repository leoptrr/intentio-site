import { defineConfig } from "astro/config";
import { SITE_URL } from "./src/site.config.mjs";

if (!SITE_URL) console.warn("[landing] SITE_URL vazio em src/site.config.mjs: sem canonical, og:url e sitemap.");

export default defineConfig({
  site: SITE_URL || undefined,
  build: { inlineStylesheets: "always" },
});
