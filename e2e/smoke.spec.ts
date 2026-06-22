import { expect, test } from "@playwright/test";

test("home page renders the matchup and language toggle", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("MESSI");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("RONALDO");

  const toggle = page.getByRole("group", { name: /language|язык/i });
  await expect(toggle).toBeVisible();

  // Switching to RU updates copy.
  await toggle.getByRole("button", { name: "RU" }).click();
  await expect(page.getByText(/Месси против Роналду/)).toBeVisible();
});
