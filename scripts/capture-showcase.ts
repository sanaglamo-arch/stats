/**
 * Showcase capture — drives the live site with motion ON
 * (`reducedMotion: "no-preference"`) and records key-state screenshots + an
 * interaction video into `preview/`. This is deliberately separate from the gate
 * e2e, which forces reduced-motion for determinism; here we want the full
 * cinematic motion visible.
 *
 *   BASE_URL=http://localhost:3200 pnpm exec tsx scripts/capture-showcase.ts
 *
 * Assumes a server is already serving the app at BASE_URL.
 */
import { chromium, type Page } from "playwright";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PREVIEW = join(ROOT, "preview");
const VIDEO_TMP = join(ROOT, ".showcase-video");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3200";

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

async function main(): Promise<void> {
  mkdirSync(PREVIEW, { recursive: true });
  rmSync(VIDEO_TMP, { recursive: true, force: true });
  mkdirSync(VIDEO_TMP, { recursive: true });

  const browser = await chromium.launch({
    executablePath: SYSTEM_CHROME,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  // ── Desktop: cinematic interaction video + key-state screenshots ──
  const dWidth = 1366;
  const dHeight = 854;
  const desktop = await browser.newContext({
    viewport: { width: dWidth, height: dHeight },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    recordVideo: { dir: VIDEO_TMP, size: { width: dWidth, height: dHeight } },
  });
  const page = await desktop.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // 1) Hero cinematic entrance — let the stagger play, then capture.
  await sleep(1700);
  await page.screenshot({ path: join(PREVIEW, "home-desktop-1366.png") });

  // 2) Momentum-scroll down to the studio (wheel feeds Lenis).
  await wheelTo(page, 760);
  // Card arrival spring + bars fill + count-up.
  await sleep(1400);
  await page.screenshot({ path: join(PREVIEW, "home-desktop-studio.png") });

  // 3) Drive the NEW controls → card morph/crossfade + re-count.
  //    - global Champions League context tab (applies to both players);
  //    - Messi → career period;
  //    - Ronaldo → penalties toggle;
  //    - drop a stat chip via the stat picker.
  const messiPanel = page.getByRole("region", { name: "Lionel Messi" });
  const ronaldoPanel = page.getByRole("region", { name: "Cristiano Ronaldo" });
  await page.getByRole("tab", { name: /Champions League/i }).click();
  await sleep(900);
  await messiPanel.getByRole("radio", { name: /^Career$/i }).click();
  await sleep(900);
  await ronaldoPanel.getByRole("switch").click();
  await sleep(900);
  await page.getByRole("switch", { name: /^Goals$/ }).click();
  await sleep(1300);
  await page.screenshot({ path: join(PREVIEW, "home-desktop-card-updated.png") });

  // 4) Hover the Download button to show the magnetic micro-interaction.
  const download = page.getByRole("button", { name: /Download PNG/i });
  const box = await download.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height / 2);
    await sleep(250);
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 - 6);
    await sleep(450);
  }

  // 5) Scroll on to the parallax verdict band.
  await wheelTo(page, 1100);
  await sleep(900);

  await page.close();
  await desktop.close();

  // Save the recorded video into preview/.
  const vids = readdirSync(VIDEO_TMP).filter((f) => f.endsWith(".webm"));
  if (vids[0]) {
    renameSync(join(VIDEO_TMP, vids[0]), join(PREVIEW, "showcase-desktop.webm"));
  }
  rmSync(VIDEO_TMP, { recursive: true, force: true });

  // ── Mobile: full-screen card + Customize bottom-sheet ──
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
  });
  const mpage = await mobile.newPage();
  await mpage.goto(BASE_URL, { waitUntil: "networkidle" });
  await sleep(1600);
  await mpage.screenshot({ path: join(PREVIEW, "home-mobile-390.png") });

  // Scroll to the studio, open the Customize sheet.
  await mpage.evaluate(() =>
    document.getElementById("studio")?.scrollIntoView({ behavior: "auto" }),
  );
  await sleep(1200);
  const customize = mpage.getByRole("button", { name: /Customize/i });
  if (await customize.count()) {
    await customize.first().click();
    await sleep(900);
    await mpage.screenshot({ path: join(PREVIEW, "home-mobile-390-sheet.png") });
  }
  await mobile.close();

  await browser.close();
  console.log("Showcase capture complete → preview/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
