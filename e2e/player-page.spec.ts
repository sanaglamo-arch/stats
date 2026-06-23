import { expect, test } from "@playwright/test";

/**
 * Player profile pages (P7-5). Each fixed player has a personal stats page at
 * /player/<id>; an unknown id is a 404. We assert the player name, a career stat
 * value, and the honours section render, mirroring the existing role/text style.
 */

test("Messi profile page renders identity, a career stat and honours", async ({ page }) => {
  await page.goto("/player/messi");

  // Player name as the page H1.
  await expect(page.getByRole("heading", { level: 1, name: "Lionel Messi" })).toBeVisible();

  // Career totals section + the goals headline tile (a real career stat value).
  await expect(page.getByRole("heading", { name: /career totals/i })).toBeVisible();
  // Goals appears as a metric label with a numeric value next to it.
  await expect(page.getByText("Goals").first()).toBeVisible();

  // Season-by-season table is present.
  await expect(page.getByRole("heading", { name: /season by season/i })).toBeVisible();

  // Honours section with the Ballon d'Or honour tile.
  await expect(page.getByRole("heading", { name: /^honours$/i })).toBeVisible();
  await expect(page.getByText(/ballon d'or/i).first()).toBeVisible();
});

test("Ronaldo profile page renders identity and honours", async ({ page }) => {
  await page.goto("/player/ronaldo");

  await expect(
    page.getByRole("heading", { level: 1, name: "Cristiano Ronaldo" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /career totals/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^honours$/i })).toBeVisible();
});

test("an invalid player id returns 404", async ({ page }) => {
  const response = await page.goto("/player/pele");
  expect(response?.status()).toBe(404);
});

test("the studio links to each player's profile", async ({ page }) => {
  await page.goto("/");
  const messiPanel = page.getByRole("region", { name: "Lionel Messi" });
  const profileLink = messiPanel.getByRole("link", { name: /Lionel Messi.*profile/i });
  await expect(profileLink).toHaveAttribute("href", "/player/messi");
});
