import { expect, test } from "@playwright/test";

/**
 * Happy path: the new guided GOAT-comparison flow (P9).
 *
 *   home arena → "Choose categories" → /compare (toggle a category, Start)
 *   → /verdict (final verdict + per-category breakdown) → open the share modal.
 *
 * Resilient role/text selectors only; no PNG render (that path is covered by the
 * /api/share + /api/card route tests and is too slow for the smoke journey).
 */
test("guided flow: arena → compare → verdict → share", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/");

  // Enter the guided flow from the arena's primary CTA.
  await page.getByRole("link", { name: /choose categories|выбрать категории|start/i }).first().click();
  await expect(page).toHaveURL(/\/compare/);

  // The category selection step renders a grid of include checkboxes.
  const checkboxes = page.getByRole("checkbox");
  await expect(checkboxes.first()).toBeVisible();
  const count = await checkboxes.count();
  expect(count).toBeGreaterThanOrEqual(4);

  // Toggle one category OFF then start the comparison.
  const first = checkboxes.first();
  await expect(first).toHaveAttribute("aria-checked", "true");
  await first.click();
  await expect(first).toHaveAttribute("aria-checked", "false");

  await page.getByRole("button", { name: /start comparison|начать сравнение/i }).click();
  await expect(page).toHaveURL(/\/verdict/);

  // The verdict screen shows the final verdict header + a category breakdown.
  await expect(page.getByText(/final verdict|финальный вердикт/i).first()).toBeVisible();
  await expect(page.getByText(/breakdown|разбор/i).first()).toBeVisible();

  // The share modal opens from the verdict's share action.
  await page.getByRole("button", { name: /^share$|поделиться|download summary|скачать/i }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img", { name: /preview|превью/i })).toBeVisible();

  // Modal is dismissible (close button).
  await dialog.getByRole("button", { name: /close|закрыть/i }).first().click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
