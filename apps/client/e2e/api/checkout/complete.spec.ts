import { test, expect } from "@playwright/test";
import { seedProduct } from "../../utils/seed-product";
import { createTestCheckoutSession } from "../../utils/checkout";

const CART_COOKIE = { name: "cart", domain: "localhost", path: "/" };

test.describe("GET /api/checkout/complete", () => {
  test("clears the guest cart cookie for a cart checkout", async ({
    page,
  }) => {
    const product = await seedProduct();
    await page.context().addCookies([
      {
        ...CART_COOKIE,
        value: JSON.stringify([
          { variantId: product.variant.id, quantity: 1 },
        ]),
      },
    ]);

    const session = await createTestCheckoutSession({
      variantId: product.variant.id,
      unitAmount: product.variant.price,
      source: "cart",
    });

    await page.goto(`/api/checkout/complete?session_id=${session.id}`);

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "cart")).toBeUndefined();
  });

  test("leaves the guest cart cookie alone for a buy-now checkout", async ({
    page,
  }) => {
    const product = await seedProduct();
    await page.context().addCookies([
      {
        ...CART_COOKIE,
        value: JSON.stringify([
          { variantId: product.variant.id, quantity: 1 },
        ]),
      },
    ]);

    const session = await createTestCheckoutSession({
      variantId: product.variant.id,
      unitAmount: product.variant.price,
      source: "buy-now",
    });

    await page.goto(`/api/checkout/complete?session_id=${session.id}`);

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "cart")).toBeTruthy();
  });

  test("404s on the success page when no session id is given", async ({
    page,
  }) => {
    const response = await page.goto("/api/checkout/complete");
    expect(response?.status()).toBe(404);
  });

  test("404s on the success page when the session id is not real", async ({
    page,
  }) => {
    const response = await page.goto(
      "/api/checkout/complete?session_id=cs_test_not_a_real_session",
    );
    expect(response?.status()).toBe(404);
  });
});
