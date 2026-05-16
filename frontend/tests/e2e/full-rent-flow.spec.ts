import { test, expect } from "@playwright/test";

test.describe("Full Rent Collection Flow", () => {
  test.skip("create building, apartment, tenant, agreement, due, payment", async ({ page }) => {
    // This test requires a running backend with seeded data
    // and an authenticated owner session.
    //
    // Steps:
    // 1. Login as owner
    // 2. Navigate to Buildings page
    // 3. Create a new building
    // 4. Create an apartment in the building
    // 5. Assign a tenant to the apartment
    // 6. Create a rent agreement
    // 7. Generate monthly due
    // 8. Record payment
    // 9. Verify dashboard stats updated
  });
});