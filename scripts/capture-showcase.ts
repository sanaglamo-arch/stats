/**
 * Showcase capture — drives the live site with motion ON
 * (`reducedMotion: "no-preference"`) and records key-state screenshots + an
 * interaction video into `preview/`. This is deliberately separate from the gate
 * e2e, which forces reduced-motion for determinism; here we want the full
 * cinematic motion visible.
 *
 * Captures the full P9 "CompareGOATs" flow at desktop (1366) and true mobile
 * (390) widths: GOAT Arena home, /compare, /verdict, /cards (FUT) and the share
 * modal, plus a cinematic arena interaction video.
 *
 *   BASE_URL=http://localhost:3000 ./node_modules/.bin/tsx scripts/capture-showcase.ts
 *
 * (Use the tsx binary directly — the pnpm/corepack shim is unreliable in this
 * sandbox.) Assumes a server is already serving the app at BASE_URL.
 */
import { chromium, type Page } from "playwright";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PREVIEW = join(ROOT, "preview");
const VIDEO_TMP = join(ROOT, ".showcase-video");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const SYSTEM_CHROME = [
  process.env.CHROME_PATH,
  "/opt/google/chrome/chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].find((p): p is string => typeof p === "string" && existsSync(p));

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Momentum-scroll by feeding wheel events to Lenis, then let inertia settle. */
async function wheelTo(page: Page, total: number, step = 130): Promise<void> {
  let scrolled = 0;
  while (scrolled < total) {
    await page.mouse.wheel(0, step);
    scrolled += step;
    await sleep(110);
  }
  await sleep(700);
}

/**
 * Fire every `whileInView` reveal by driving REAL wheel events to the bottom and
 * back (framer's IntersectionObserver does not trigger on programmatic scroll),
 * so a subsequent full-page screenshot shows all sections in their final state.
 */
async function revealAll(page: Page): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await wheelTo(page, height, 260);
  await sleep(500);
  await page.mouse.wheel(0, -height - 2000);
  await sleep(700);
}

/** Wait for fonts + images, reveal all sections, then full-page screenshot. */
async function fullShot(page: Page, url: string, name: string): Promise<void> {
  await page.goto(BASE_URL + url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("img")];
    await Promise.all(
      imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))),
    );
  });
  await sleep(900);
  await revealAll(page);
  await page.screenshot({ path: join(PREVIEW, name), fullPage: true });
}

async function main(): Promise<void> {
  mkdirSync(PREVIEW, { recursive: true });
  rmSync(VIDEO_TMP, { recursive: true, force: true });
  mkdirSync(VIDEO_TMP, { recursive: true });

  const browser = await chromium.launch({
    executablePath: SYSTEM_CHROME,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  // ── Desktop: cinematic arena interaction video + key-state screenshots ──
  const dWidth = 1366;
  const dHeight = 854;
  const desktop = await browser.newContext({
    viewport: { width: dWidth, height: dHeight },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    recordVideo: { dir: VIDEO_TMP, size: { width: dWidth, height: dHeight } },
  });
  const page = await desktop.newPage();

  // 1) GOAT Arena home — hero cinematic entrance, then the scrolled arena.
  await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await sleep(1700);
  await page.screenshot({ path: join(PREVIEW, "home-desktop-1366.png") });

  // Momentum-scroll into the player renders + divergent comparison bars.
  await wheelTo(page, 820);
  await sleep(900);
  // Switch the live category context (tab) to show the bars re-animate.
  const assistsTab = page.getByRole("tab", { name: /^assists$/i });
  if (await assistsTab.count()) {
    await assistsTab.first().click();
    await sleep(1100);
  }
  await page.screenshot({ path: join(PREVIEW, "home-desktop-arena.png") });

  // Scroll on to the verdict panel + share CTA (parallax / reveal).
  await wheelTo(page, 900);
  await sleep(900);
  // Full-page arena capture (all sections revealed).
  await revealAll(page);
  await page.screenshot({ path: join(PREVIEW, "home-desktop-fullpage.png"), fullPage: true });

  // 2) Guided flow screens (desktop, full page).
  await fullShot(page, "/compare", "compare-desktop.png");
  await fullShot(page, "/verdict", "verdict-desktop.png");
  await fullShot(page, "/cards", "cards-desktop.png");

  // 3) Share modal (opened from the verdict's Share action).
  await page.goto(BASE_URL + "/verdict", { waitUntil: "networkidle" });
  await sleep(900);
  const share = page.getByRole("button", { name: /^share$|поделиться/i });
  if (await share.count()) {
    await share.first().click();
    await sleep(1200);
    await page.screenshot({ path: join(PREVIEW, "share-desktop.png") });
  }

  await page.close();
  await desktop.close();

  // Save the recorded interaction video into preview/.
  const vids = readdirSync(VIDEO_TMP).filter((f) => f.endsWith(".webm"));
  if (vids[0]) {
    renameSync(join(VIDEO_TMP, vids[0]), join(PREVIEW, "showcase-desktop.webm"));
  }
  rmSync(VIDEO_TMP, { recursive: true, force: true });

  // ── Mobile: true 390px, every screen of the flow ──
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
  });
  const mpage = await mobile.newPage();

  await fullShot(mpage, "/", "home-mobile-390.png");
  await fullShot(mpage, "/compare", "compare-mobile-390.png");
  await fullShot(mpage, "/verdict", "verdict-mobile-390.png");
  await fullShot(mpage, "/cards", "cards-mobile-390.png");

  // Mobile share modal (bottom-sheet).
  await mpage.goto(BASE_URL + "/verdict", { waitUntil: "networkidle" });
  await sleep(900);
  const mShare = mpage.getByRole("button", { name: /^share$|поделиться/i });
  if (await mShare.count()) {
    await mShare.first().click();
    await sleep(1300);
    await mpage.screenshot({ path: join(PREVIEW, "home-mobile-390-sheet.png"), fullPage: true });
  }

  await mobile.close();
  await browser.close();
  console.log("Showcase capture complete → preview/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
