import { type NextRequest } from "next/server";
import { chromium, type Browser, type LaunchOptions } from "playwright";
import { CARD_HEIGHT, CARD_WIDTH } from "@/components/card/card-dimensions";

/**
 * PNG render endpoint (SPEC §10). Navigates a headless browser to the full-bleed
 * /render/card page (params drive the slice) and screenshots the card element at
 * exactly 1080×1620 → returns image/png.
 *
 * Robust browser launch: tries the bundled Playwright chromium first, then falls
 * back to the system Chrome channel / known executable path (the sandbox here
 * has Chrome at /opt/google/chrome/chrome but no downloaded Playwright browser).
 *
 * Contract — query params (forwarded verbatim to /render/card, see slice-params):
 *   mSel, mComp, mPen, rSel, rComp, rPen, locale
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
    `Could not launch any browser for card rendering. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

function renderUrl(request: NextRequest): string {
  const origin = request.nextUrl.origin;
  const target = new URL("/render/card", origin);
  // Forward every query param straight through to the render page.
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  return target.toString();
}

export async function GET(request: NextRequest): Promise<Response> {
  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage({
      viewport: { width: CARD_WIDTH, height: CARD_HEIGHT },
      deviceScaleFactor: 1,
    });

    await page.goto(renderUrl(request), { waitUntil: "networkidle", timeout: 30_000 });
    const card = page.locator("#card-root");
    await card.waitFor({ state: "visible", timeout: 10_000 });
    // Let webfonts settle so Orbitron/Inter render in the shot.
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
    return new Response(JSON.stringify({ error: "card_render_failed", detail: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await browser?.close();
  }
}
