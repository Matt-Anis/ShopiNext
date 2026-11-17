import { expect, type Page } from "@playwright/test"
import { clickUntilHydrated } from "./interaction"

export async function chooseProductSort(page: Page, label: string) {
  const trigger = page.getByRole("combobox", { name: "Sort products", exact: true })
  const option = page.getByRole("option", { name: label, exact: true })
  await clickUntilHydrated(trigger, () => expect(option).toBeVisible())
  await option.click()
  await expect(trigger.locator('[data-slot="select-value"]')).toHaveText(label)
}

export async function expectDiscoveryOrder(page: Page, prefix: string, ids: string[]) {
  const cards = page.locator('#products [data-slot="card"][data-testid^="product-card-"]')
    .filter({ hasText: prefix })
  await expect(cards).toHaveCount(ids.length)
  for (const [index, id] of ids.entries()) {
    await expect(cards.nth(index)).toHaveAttribute("data-testid", `product-card-${id}`)
  }
}
