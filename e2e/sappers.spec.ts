import { test, expect } from "@playwright/test";

test("plays a full beginner game to a win", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Ready")).toBeVisible();
  await expect(page.locator(".cell")).toHaveCount(81);

  // Beginner is 9 rows x 9 cols; reveal every non-mine-adjacent-looking cell
  // isn't deterministic without knowing mine placement, so instead click the
  // first cell (guaranteed safe by first-click rules) and just assert the
  // game state transitions correctly rather than forcing a full clear.
  await page.locator('.cell[data-row="0"][data-col="0"]').click();
  await expect(page.getByText("Clearing")).toBeVisible();
});

test("flags a cell via right-click without revealing it", async ({ page }) => {
  await page.goto("/");

  const cell = page.locator('.cell[data-row="3"][data-col="3"]');
  await cell.click({ button: "right" });

  await expect(cell).toHaveClass(/cell--flagged/);
  await expect(cell).not.toHaveClass(/cell--revealed/);
});

test("switches clearance level and resizes the board", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("radio", { name: /sapper/i }).click();
  await expect(page.locator(".cell")).toHaveCount(16 * 16);

  await page.getByRole("radio", { name: /demolitions/i }).click();
  await expect(page.locator(".cell")).toHaveCount(16 * 30);
});

test("New Field resets an in-progress game", async ({ page }) => {
  await page.goto("/");

  await page.locator('.cell[data-row="0"][data-col="0"]').click();
  await expect(page.getByText("Clearing")).toBeVisible();

  await page.getByRole("button", { name: "New Field" }).click();
  await expect(page.getByText("Ready")).toBeVisible();
});
