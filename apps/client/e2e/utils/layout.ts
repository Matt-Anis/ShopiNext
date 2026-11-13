import { expect, type Locator } from "@playwright/test"

export async function expectCenteredInViewport(locator: Locator) {
  await expect(locator).toBeVisible()
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return Math.abs(bounds.left + bounds.width / 2 - window.innerWidth / 2)
      })
    )
    .toBeLessThanOrEqual(2)
}

export async function expectHorizontalOrder(locators: Locator[]) {
  await expect(async () => {
    let previous: { right: number; centerY: number } | undefined

    for (const locator of locators) {
      await expect(locator).toBeVisible()
      const bounds = await locator.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return {
          left: rect.left,
          right: rect.right,
          centerY: rect.top + rect.height / 2,
        }
      })

      if (previous) {
        expect(bounds.left).toBeGreaterThanOrEqual(previous.right - 1)
        expect(Math.abs(bounds.centerY - previous.centerY)).toBeLessThanOrEqual(
          2
        )
      }
      previous = bounds
    }
  }).toPass({ timeout: 10_000 })
}
