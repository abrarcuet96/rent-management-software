import { test, expect } from "@playwright/test";

test.describe("Multi-Tenant Flow", () => {
  test.skip("manage multiple buildings, apartments, tenants", async ({ page }) => {
    // This test requires a running backend with seeded data
    // and an authenticated owner session.
    //
    // Steps:
    // 1. Login as owner
    // 2. Create 2 buildings
    // 3. Create apartments in each building
    // 4. Assign tenants to apartments
    // 5. Generate dues for multiple tenants
    // 6. Record mixed payments
    // 7. Verify tenant list shows all tenants
  });
});
