import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("can navigate to login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /লগইন/i })).toBeVisible();
  });

  test("can navigate to register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /নিবন্ধন/i })).toBeVisible();
  });
});
