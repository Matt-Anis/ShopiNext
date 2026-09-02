import { expect, type Locator, type Page } from "@playwright/test";

// The PDP renders its add-to-cart controls twice (mobile sticky bar and
// desktop sidebar); only one is actually visible at a given viewport.
export const visible = (page: Page, testId: string) =>
  page.getByTestId(testId).and(page.locator(":visible"));

// A freshly loaded page can paint a client component's button before React
// finishes hydrating it, so a click in that window reaches no listener and
// silently does nothing. Retrying the click until the expected effect shows
// up rides out that gap instead of failing on the first miss.
export const clickUntilHydrated = async (
  button: Locator,
  assertion: () => Promise<void>,
  options?: { timeout?: number },
) => {
  await expect(async () => {
    await button.click();
    await assertion();
  }).toPass(options);
};
