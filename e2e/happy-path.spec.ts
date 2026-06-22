import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// PNG 8-byte magic signature.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Happy-path: the real user journey end-to-end.
 *
 *   load page → change at least one slice control on EACH player
 *   (season/competition/penalties) → confirm the live preview card reacts
 *   → click "Download PNG" → assert a real PNG download lands on disk.
 *
 * The /api/card route renders the card with a headless browser, so this spec
 * must run with the sandbox disabled (system Chrome, `--no-sandbox`).
 */
test("happy path: tweak slices on both players, preview updates, download a real PNG", async ({
  page,
}) => {
  // The /api/card route spins up a headless browser to render the card, which
  // is slow in CI/sandbox (first hit also compiles the route) — well past the
  // 30s default test timeout. Give the whole journey generous headroom so the
  // real server-side PNG render can complete.
  test.setTimeout(150_000);

  await page.goto("/");

  const messiPanel = page.getByRole("region", { name: "Lionel Messi" });
  const ronaldoPanel = page.getByRole("region", { name: "Cristiano Ronaldo" });
  await expect(messiPanel).toBeVisible();
  await expect(ronaldoPanel).toBeVisible();

  // --- Messi: switch the period mode to Career and verify the card reacts. ---
  // The card's period plaque is the live proof the preview re-rendered. The
  // plaque renders the *period value* in its own element (e.g. "2011/12/2014/15"
  // when each side is a single season). That value element is what flips to
  // include "Career" once the Messi side becomes career — unlike the always-
  // present "Career" segmented-control radio, which lives in the controls and
  // never proves the preview updated.
  //
  // Default Messi side is a single season, so the plaque value is a "YYYY/YY"
  // season token and does NOT yet read "Career/...".
  await expect(page.getByText(/\d{4}\/\d{2}/).first()).toBeVisible();
  await expect(page.getByText(/Career\s*\//)).toHaveCount(0);

  await messiPanel.getByRole("radio", { name: /^Career$/i }).click();
  await expect(messiPanel.getByRole("radio", { name: /^Career$/i })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  // Live preview's period plaque value now reads "Career/<Ronaldo season>" — the
  // in-memory card re-rendered from the new slice. Matching "Career/" (career on
  // the Messi side, a season still on Ronaldo's) cannot be satisfied by the
  // control radio, whose accessible text is just "Career".
  await expect(page.getByText(/Career\s*\//).first()).toBeVisible();

  // --- Ronaldo: change a different slice — the competition filter select. ---
  // Target the competition <select> by its stable id (the panel also holds a
  // season select while in "season" mode, so a plain combobox role is
  // ambiguous). Selecting by option value keeps this locale-independent.
  const ronaldoComp = ronaldoPanel.locator("#ronaldo-comp");
  await expect(ronaldoComp).toBeVisible();
  await ronaldoComp.selectOption("champions_league");
  await expect(ronaldoComp).toHaveValue("champions_league");

  // --- Ronaldo: also flip the penalties toggle (a third kind of control). ---
  const penToggle = ronaldoPanel.getByRole("switch");
  await expect(penToggle).toBeVisible();
  const penBefore = await penToggle.getAttribute("aria-checked");
  await penToggle.click();
  await expect(penToggle).not.toHaveAttribute("aria-checked", penBefore ?? "");

  // --- Download PNG: capture the real browser download event. ---
  const download = page.getByRole("button", { name: /Download PNG/i });
  await expect(download).toBeEnabled();

  // The button fetches /api/card (headless render) → blob → anchor click, so
  // give the server render generous headroom.
  const downloadPromise = page.waitForEvent("download", { timeout: 90_000 });
  await download.click();
  const dl = await downloadPromise;

  // Suggested filename must be a .png.
  expect(dl.suggestedFilename()).toMatch(/\.png$/i);

  // The downloaded file must exist, be non-empty, and carry the PNG signature.
  const path = await dl.path();
  expect(path).toBeTruthy();
  const bytes = readFileSync(path as string);
  expect(bytes.byteLength).toBeGreaterThan(1024);
  expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
});
