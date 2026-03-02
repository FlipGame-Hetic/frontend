import { test, expect } from "@playwright/test"

test("app loads and renders canvas", async ({ page }) => {
  await page.goto("/")
  const canvas = page.locator("canvas")
  await expect(canvas).toBeVisible()
})
