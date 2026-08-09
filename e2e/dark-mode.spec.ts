import { test, expect } from "@playwright/test";

test("renders with dark theme tokens under a dark color scheme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const background = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  // --paper dark value is #1B1D16 -> rgb(27, 29, 22)
  expect(background).toBe("rgb(27, 29, 22)");
});

test("renders with light theme tokens under a light color scheme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  const background = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  // --paper light value is #EFEAD9 -> rgb(239, 234, 217)
  expect(background).toBe("rgb(239, 234, 217)");
});
