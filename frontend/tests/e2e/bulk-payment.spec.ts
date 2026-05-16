import { test, expect } from "@playwright/test";

test.describe("Bulk Payment Flow", () => {
  test.skip("navigate to payments page, select tenant, distribute payment", async ({ page }) => {
    // This test requires a running backend with seeded data
    // and an authenticated owner session.
    //
    // Steps:
    // 1. Login as owner
    // 2. Navigate to /payments
    // 3. Select "বাল্ক পেমেন্ট" tab
    // 4. Select a tenant from the dropdown
    // 5. Enter a total amount
    // 6. Verify distribution preview shows correct amounts
    // 7. Submit the payment
    // 8. Verify success toast appears
  });
});
