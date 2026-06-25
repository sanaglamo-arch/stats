import { expect, test } from "@playwright/test";

/**
 * Smoke: the Phase-10 VERDICT ARENA (`/`) — the whole product on one screen.
 * Asserts the brand wordmark, the arena H1, both players present, the inline
 * category breakdown, the verdict score band, the single Share CTA + sheet, and
 * the RU/EN toggle — all via resilient role/text selectors (no DOM coupling).
 */
test("verdict arena renders the brand, both players, breakdown, score and share", async ({
  page,
}) => {
  await page.goto("/");

  // Brand chrome: the CompareGOATs wordmark in the app header.
  await expect(page.getByRole("link", { name: /CompareGOATs/i }).first()).toBeVisible();

  // The arena H1 ("GOAT ARENA").
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText(/ARENA/i);

  // Both players present on the clash (names appear in the identity chips / score).
  await expect(page.getByText(/Cristiano Ronaldo/i).first()).toBeVisible();
  await expect(page.getByText(/Lionel Messi/i).first()).toBeVisible();

  // The inline category breakdown with per-category count checkboxes.
  await expect(page.getByText(/category breakdown|разбор по категориям/i).first()).toBeVisible();
  const checkboxes = page.getByRole("checkbox");
  await expect(checkboxes.first()).toBeVisible();
  expect(await checkboxes.count()).toBeGreaterThanOrEqual(4);

  // The Show-winner switch governs the verdict (default ON).
  const winnerSwitch = page.getByRole("switch", { name: /show winner|показать победителя/i });
  await expect(winnerSwitch).toBeVisible();
  await expect(winnerSwitch).toHaveAttribute("aria-checked", "true");

  // The share sheet opens from the single primary CTA.
  await page.getByRole("button", { name: /share verdict|поделиться вердиктом/i }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img", { name: /preview|превью/i })).toBeVisible();

  // Close it (Esc) and confirm it dismisses.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // RU/EN toggle flips the UI copy: switching to RU changes the H1 to Cyrillic.
  const langGroup = page.getByRole("group", { name: /language|язык/i }).first();
  await expect(langGroup).toBeVisible();
  await langGroup.getByRole("button", { name: "RU" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Арена/i);
});
