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

  // Phase-10 single-screen IA: `/` is the whole Verdict Arena; /compare + /verdict
  // are merged in (they 307-redirect); /cards is demoted off-path; /player/[id]
  // is off-path depth; Share is a sheet over `/`.

  // 1) GOAT Arena home — hero cinematic entrance (clash + score band).
  await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await sleep(1700);
  await page.screenshot({ path: join(PREVIEW, "home-desktop-1366.png") });

  // Momentum-scroll into the clash + verdict + category breakdown.
  await wheelTo(page, 860);
  await sleep(900);
  await page.screenshot({ path: join(PREVIEW, "home-desktop-arena.png") });

  // Full-page arena capture (all sections revealed).
  await revealAll(page);
  await page.screenshot({ path: join(PREVIEW, "home-desktop-fullpage.png"), fullPage: true });

  // 2) Expand a category to reveal the inline "By league" split (p10-5).
  const goalsRow = page.getByRole("button", { name: /show goals/i });
  if (await goalsRow.count()) {
    await goalsRow.first().scrollIntoViewIfNeeded();
    await goalsRow.first().click();
    await sleep(900);
    await revealAll(page);
    await page.screenshot({ path: join(PREVIEW, "arena-leagues-desktop.png"), fullPage: true });
  }

  // 3) Off-path screens: demoted /cards + a player profile.
  await fullShot(page, "/cards", "cards-desktop.png");
  await fullShot(page, "/player/messi", "player-messi-desktop.png");

  // 4) Share sheet — opened from the single "Share Verdict" CTA on `/`.
  await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
  await sleep(900);
  const share = page.getByRole("button", { name: /share verdict|поделиться вердиктом/i });
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

  // ── Mobile: true 390px ──
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
  });
  const mpage = await mobile.newPage();

  await fullShot(mpage, "/", "home-mobile-390.png");

  // Mobile by-league split (expand Goals).
  const mGoals = mpage.getByRole("button", { name: /show goals/i });
  if (await mGoals.count()) {
    await mGoals.first().scrollIntoViewIfNeeded();
    await mGoals.first().click();
    await sleep(800);
    await revealAll(mpage);
    await mpage.screenshot({ path: join(PREVIEW, "arena-leagues-mobile-390.png"), fullPage: true });
  }

  await fullShot(mpage, "/cards", "cards-mobile-390.png");

  // Mobile share bottom-sheet.
  await mpage.goto(BASE_URL + "/", { waitUntil: "networkidle" });
  await sleep(900);
  const mShare = mpage.getByRole("button", { name: /share verdict|поделиться вердиктом/i });
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
