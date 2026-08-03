import { expect, test } from "@playwright/test";

test("super administrator signs in and sees the permission-aware shell", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Remittance Agent Administration Portal" })).toBeVisible();
  await page.getByRole("button", { name: "Continue securely" }).click();
  await expect(page.getByRole("heading", { name: "Operations dashboard" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toContainText("Audit Log");
});
