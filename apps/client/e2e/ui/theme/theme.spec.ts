import { expect, test } from "@playwright/test"
import { clickUntilHydrated } from "../../utils/interaction"

const darkClass = /(?:^|\s)dark(?:\s|$)/

for (const width of [320, 1280]) {
  test.describe(`theme controls at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    test("follows the system preference until a keyboard override", async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "light" })
      await page.goto("/login")

      const html = page.locator("html")
      const toggle = page.getByRole("button", {
        name: "Dark theme",
        exact: true,
      })
      await expect(toggle).toBeEnabled()
      await expect(toggle).toHaveAttribute("aria-pressed", "false")
      await expect(html).not.toHaveClass(darkClass)

      await page.emulateMedia({ colorScheme: "dark" })
      await expect(html).toHaveClass(darkClass)
      await expect(toggle).toHaveAttribute("aria-pressed", "true")

      await toggle.focus()
      await page.keyboard.press("Space")
      await expect(html).not.toHaveClass(darkClass)
      await expect(toggle).toHaveAttribute("aria-pressed", "false")

      await page.emulateMedia({ colorScheme: "light" })
      await page.emulateMedia({ colorScheme: "dark" })
      await expect(html).not.toHaveClass(darkClass)
    })

    test("persists both explicit themes across reloads and routes", async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "light" })
      await page.goto("/login")

      const html = page.locator("html")
      const toggle = page.getByRole("button", {
        name: "Dark theme",
        exact: true,
      })
      await expect(toggle).toHaveAttribute("aria-pressed", "false")
      await clickUntilHydrated(toggle, () =>
        expect(toggle).toHaveAttribute("aria-pressed", "true")
      )
      await expect(html).toHaveClass(darkClass)

      await page.reload()
      await expect(html).toHaveClass(darkClass)
      await expect(toggle).toHaveAttribute("aria-pressed", "true")

      await page.goto("/privacy-policy")
      await expect(html).toHaveClass(darkClass)
      await expect(toggle).toHaveAttribute("aria-pressed", "true")
      await clickUntilHydrated(toggle, () =>
        expect(toggle).toHaveAttribute("aria-pressed", "false")
      )
      await expect(html).not.toHaveClass(darkClass)

      await page.emulateMedia({ colorScheme: "dark" })
      await page.reload()
      await expect(html).not.toHaveClass(darkClass)
      await expect(toggle).toHaveAttribute("aria-pressed", "false")

      await page.goto("/forgot-password")
      await expect(html).not.toHaveClass(darkClass)
      await expect(toggle).toHaveAttribute("aria-pressed", "false")
    })

    test("keeps the storefront theme control accessible without horizontal overflow", async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "light" })
      await page.goto("/")

      const toggle = page
        .getByRole("banner")
        .getByRole("button", { name: "Dark theme", exact: true })
      await expect(toggle).toBeInViewport()
      await clickUntilHydrated(toggle, () =>
        expect(toggle).toHaveAttribute("aria-pressed", "true")
      )
      await expect(page.locator("html")).toHaveClass(darkClass)
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth
          )
        )
        .toBeLessThanOrEqual(1)
    })
  })
}
