import { expect, test } from "@playwright/test";

/**
 * Happy path: the Phase-10 single-screen "settle + share" flow.
 *
 *   land on `/` (verdict already visible) → refine the score by toggling a
 *   category off in the inline breakdown → open the share sheet → it carries a
 *   live preview → close it.
 *
 * The old multi-page flow (/compare → /verdict) is merged into `/`; this asserts
 * the settle+share job is done on one screen. Resilient role/text selectors only.
 */
test("single-screen flow: settle on / then share", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/");

  // The verdict is the landing — the score band + breakdown render with no clicks.
  await expect(page.getByText(/category breakdown|разбор по категориям/i).first()).toBeVisible();

  // The inline breakdown exposes per-category include checkboxes (merged /compare).
  const checkboxes = page.getByRole("checkbox");
  await expect(checkboxes.first()).toBeVisible();
  const count = await checkboxes.count();
  expect(count).toBeGreaterThanOrEqual(4);

  // Toggle the FIRST category OFF → it recomputes live + dims the row.
  const first = checkboxes.first();
  await expect(first).toHaveAttribute("aria-checked", "true");
  await first.click();
  await expect(first).toHaveAttribute("aria-checked", "false");
  // The selection round-trips into the URL (?cats=) so the link is shareable.
  await expect(page).toHaveURL(/cats=/);

  // The Show-winner toggle flips the verdict into neutral mode.
  const winnerSwitch = page.getByRole("switch", { name: /show winner|показать победителя/i });
  await winnerSwitch.click();
  await expect(winnerSwitch).toHaveAttribute("aria-checked", "false");
  await winnerSwitch.click();
  await expect(winnerSwitch).toHaveAttribute("aria-checked", "true");

  // The share sheet opens from the single primary CTA (step 1 of the 2-tap share).
  await page.getByRole("button", { name: /share verdict|поделиться вердиктом/i }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img", { name: /preview|превью/i })).toBeVisible();

  // Modal is dismissible (close button).
  await dialog.getByRole("button", { name: /close|закрыть/i }).first().click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

/**
 * Old deep links still resolve: /compare and /verdict redirect to the merged
 * single screen, preserving ?cats= so shared links keep working.
 */
test("merged routes redirect to / preserving cats", async ({ page }) => {
  await page.goto("/verdict?cats=goals,assists,trophies");
  await expect(page).toHaveURL(/\/\?cats=/);
  await expect(page.getByText(/category breakdown|разбор по категориям/i).first()).toBeVisible();

  await page.goto("/compare");
  await expect(page).toHaveURL(/\/$|\/(\?.*)?$/);
});
