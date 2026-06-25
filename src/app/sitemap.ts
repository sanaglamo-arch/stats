import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// sitemap.xml (Phase 11 SEO) — the public, indexable routes. /compare + /verdict
// redirect to /, /cards is intentionally off-path, /render + /api are excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/player/messi", "/player/ronaldo"];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
