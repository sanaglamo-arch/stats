/**
 * Canonical site origin for absolute URLs (metadataBase, OG images, robots,
 * sitemap). Override with NEXT_PUBLIC_SITE_URL when a real domain is wired;
 * defaults to the current live deploy.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://82.21.92.176:3000"
).replace(/\/+$/, "");
