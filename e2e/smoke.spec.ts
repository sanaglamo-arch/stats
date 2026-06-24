import { expect, test } from "@playwright/test";

/**
 * Smoke: the new HOME ARENA (P9-2) renders end-to-end. Asserts the CompareGOATs
 * brand chrome, both players' identity cards, the category tablist + a live
 * comparison/verdict, the share modal, and the RU/EN toggle — all via resilient
 * role/text selectors (no brittle class/DOM coupling).
 */
test("home arena renders the brand, both players, category tabs, verdict and share", async ({
  page,
}) => {
  await page.goto("/");

  // Brand chrome: the CompareGOATs wordmark in the app header.
  await expect(page.getByRole("link", { name: /CompareGOATs/i }).first()).toBeVisible();

  // The arena H1 ("GOAT ARENA").
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText(/ARENA/i);

  // Both players' identity cards (their names render as headings).
  await expect(page.getByRole("heading", { name: "Cristiano Ronaldo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lionel Messi" })).toBeVisible();

  // Category tablist with selectable tabs (a real WAI-ARIA tablist).
  const tablist = page.getByRole("tablist");
  await expect(tablist).toBeVisible();
  const goalsTab = page.getByRole("tab", { name: /Goals|Голы/i });
  await expect(goalsTab).toBeVisible();
  // Selecting a different category swaps the live comparison panel.
  const assistsTab = page.getByRole("tab", { name: /Assists|Передачи/i });
  await assistsTab.click();
  await expect(assistsTab).toHaveAttribute("aria-selected", "true");

  // A final verdict panel is present on the page.
  await expect(page.getByText(/final verdict|итоговый вердикт/i).first()).toBeVisible();

  // Share modal opens from the "Generate share card" button.
  await page.getByRole("button", { name: /share card|карточк/i }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // It carries a live preview + a caption field + a download action.
  await expect(dialog.getByRole("img", { name: /preview|превью/i })).toBeVisible();
  // Close it (Esc) and confirm it dismisses.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // RU/EN toggle flips the UI copy: switching to RU changes the arena subtitle.
  const langGroup = page.getByRole("group", { name: /language|язык/i }).first();
  await expect(langGroup).toBeVisible();
  await langGroup.getByRole("button", { name: "RU" }).click();
  // The H1 copy is now Russian: "GOAT Арена". Assert the RU-only Cyrillic word
  // so the flip genuinely fails if the locale didn't change (the Latin "ARENA"
  // would otherwise pass even with no switch).
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Арена/i);
});
