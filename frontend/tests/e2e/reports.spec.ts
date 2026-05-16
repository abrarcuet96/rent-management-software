import { test, expect } from "@playwright/test";

test.describe("Reports", () => {
  test.skip("view overdue, collection, and annual reports", async ({ page }) => {
    // This test requires a running backend with seeded data
    // and an authenticated owner session.
    //
    // Steps:
    // 1. Login as owner
    // 2. Navigate to /reports
    // 3. Verify overdue report tab loads
    // 4. Switch to monthly collection tab
    // 5. Verify table loads
    // 6. Switch to annual summary tab
    // 7. Verify data loads
    // 8. Switch to payment history tab
    // 9. Select a tenant and verify payment history loads
  });
});
