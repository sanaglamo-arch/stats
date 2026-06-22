import { expect, test } from "@playwright/test";

test("studio renders the matchup, controls, preview, actions and i18n toggle", async ({ page }) => {
  await page.goto("/");

  // Matchup heading.
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText("MESSI");
  await expect(heading).toContainText("RONALDO");

  // Global competition context tabs (P6-10) render as a tablist.
  await expect(page.getByRole("tab", { name: /Champions League/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^All$/i })).toBeVisible();

  // Per-player control panels render with their period segmented control.
  const messiPanel = page.getByRole("region", { name: "Lionel Messi" });
  const ronaldoPanel = page.getByRole("region", { name: "Cristiano Ronaldo" });
  await expect(messiPanel).toBeVisible();
  await expect(ronaldoPanel).toBeVisible();
  await expect(messiPanel.getByRole("radiogroup")).toBeVisible();

  // Live preview is on screen (the card watermark proves the card rendered).
  await expect(page.getByText("FootyCompare", { exact: true }).first()).toBeVisible();

  // Download button present and enabled.
  const download = page.getByRole("button", { name: /Download PNG/i });
  await expect(download).toBeVisible();
  await expect(download).toBeEnabled();

  // Share button present.
  await expect(page.getByRole("button", { name: /^Share$/i })).toBeVisible();

  // Changing a selector updates the preview: Messi season → career changes the
  // visible period plaque text inside the card.
  await messiPanel.getByRole("radio", { name: /^Career$/i }).click();
  await expect(messiPanel.getByRole("radio", { name: /^Career$/i })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  // The card period plaque now reads "Career" (default Messi was a single season).
  await expect(page.getByText("Career").first()).toBeVisible();

  // Toggling a stat chip (P6-8) changes the card: dropping "Goals" lowers the
  // contested-categories total shown in the card's result footer.
  const contestedBefore = await page.getByText(/categories won/i).first().textContent();
  const goalsChip = page.getByRole("switch", { name: /^Goals$/ });
  await expect(goalsChip).toBeVisible();
  await goalsChip.click();
  await expect(goalsChip).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText(/categories won/i).first()).not.toHaveText(
    contestedBefore ?? "",
  );

  // RU/EN toggle flips the UI copy.
  const toggle = page.getByRole("group", { name: /language|язык/i });
  await expect(toggle).toBeVisible();
  await toggle.getByRole("button", { name: "RU" }).click();
  await expect(page.getByRole("region", { name: "Lionel Messi" }).getByText("Период")).toBeVisible();
});
