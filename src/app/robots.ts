import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// robots.txt (Phase 11 SEO) — allow all crawlers; point at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
