import { test, expect } from "@playwright/test"

test("DMD canvas loads and has drawable pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 180 })
  const response = await page.goto("/")
  expect(response?.status()).toBe(200)

  const canvas = page.locator("canvas")
  await expect(canvas).toBeVisible()
  await expect
    .poll(async () =>
      canvas.evaluate((node) => {
        const dmdCanvas = node as HTMLCanvasElement
        return { width: dmdCanvas.width, height: dmdCanvas.height }
      }),
    )
    .toEqual({ width: 320, height: 180 })
})
