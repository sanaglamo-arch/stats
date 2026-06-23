import { type NextRequest } from "next/server";
import { chromium, type Browser, type LaunchOptions } from "playwright";
import { SHARE_HEIGHT, SHARE_WIDTH } from "@/components/share/share-dimensions";

/**
 * SHARE-CARD PNG render endpoint (P9-6). Navigates a headless browser to the
 * full-bleed /render/share page and screenshots #share-root at exactly
 * 1080×1350 → returns image/png. Additive to /api/card (which is unchanged).
 *
 * SECURITY: only a fixed allow-list of params is forwarded to the render page
 * (no arbitrary query forwarding, no open redirect / SSRF surface) and the
 * target URL is always built from the request's own origin:
 *   cats        = comma-separated category keys
 *   showWinner  = "0" | "1"
 *   locale      = "en" | "ru"
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/opt/google/chrome/chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter((p): p is string => Boolean(p));

const BASE_ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars"];

/** Only these params are forwarded to the render page (no SSRF surface). */
const ALLOWED_PARAMS = ["cats", "showWinner", "locale"] as const;

/** Launch chromium, degrading from the bundled browser to system Chrome. */
async function launchBrowser(): Promise<Browser> {
  const attempts: LaunchOptions[] = [
    { headless: true, args: BASE_ARGS },
    { headless: true, channel: "chrome", args: BASE_ARGS },
    ...SYSTEM_CHROME_PATHS.map((executablePath) => ({
      headless: true,
      executablePath,
      args: BASE_ARGS,
    })),
  ];

  let lastError: unknown;
  for (const opts of attempts) {
    try {
      return await chromium.launch(opts);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `Could not launch any browser for share rendering. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

function renderUrl(request: NextRequest): string {
  const origin = request.nextUrl.origin;
  const target = new URL("/render/share", origin);
  // Forward ONLY the whitelisted params, verbatim, to the render page.
  for (const key of ALLOWED_PARAMS) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null) target.searchParams.set(key, value);
  }
  return target.toString();
}

export async function GET(request: NextRequest): Promise<Response> {
  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage({
      viewport: { width: SHARE_WIDTH, height: SHARE_HEIGHT },
      deviceScaleFactor: 1,
    });

    await page.goto(renderUrl(request), { waitUntil: "networkidle", timeout: 30_000 });
    const card = page.locator("#share-root");
    await card.waitFor({ state: "visible", timeout: 10_000 });
    // Let webfonts settle so Bebas Neue/Inter render in the shot.
    await page.evaluate(() => document.fonts.ready);

    const png = await card.screenshot({ type: "png" });

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown render error";
    return new Response(JSON.stringify({ error: "share_render_failed", detail: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await browser?.close();
  }
}
