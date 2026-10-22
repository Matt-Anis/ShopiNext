import { test, expect } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { cart, cartItems } from "@repo/db/public/schema";
import { user } from "@repo/db/public/auth-schema";
import { testDb } from "../../utils/db";
import { seedUser } from "../../utils/seed-user";
import { seedProduct, seedProductWithVariants } from "../../utils/seed-product";
import { clickUntilHydrated, visible } from "../../utils/interaction";
import { signIn } from "../../utils/auth";

let credentials: Awaited<ReturnType<typeof seedUser>>;
let product: Awaited<ReturnType<typeof seedProduct>>;
let userId: string;

test.beforeEach(async ({ page, request }) => {
  credentials = await seedUser(request);
  const [seededUser] = await testDb
    .select()
    .from(user)
    .where(eq(user.email, credentials.email));
  userId = seededUser.id;
  product = await seedProduct();
  await signIn(page, credentials);
});

test.describe("Authenticated cart", () => {
  test("adding a product updates the badge", async ({ page }) => {
    await clickUntilHydrated(
      page.getByTestId(`cart-control-add-${product.id}`),
      () =>
        expect(
          page.getByTestId(`cart-control-quantity-${product.id}`),
        ).toHaveText("1 in cart", { timeout: 1000 }),
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
  });

  test("cart is persisted server-side, not just client state", async ({
    page,
  }) => {
    await clickUntilHydrated(
      page.getByTestId(`cart-control-add-${product.id}`),
      () =>
        expect(
          page.getByTestId(`cart-control-quantity-${product.id}`),
        ).toHaveText("1 in cart", { timeout: 1000 }),
    );

    await page.getByTestId(`cart-control-increment-${product.id}`).click();
    await expect(
      page.getByTestId(`cart-control-quantity-${product.id}`),
    ).toHaveText("2 in cart");

    const [cartRow] = await testDb
      .select()
      .from(cart)
      .where(eq(cart.userId, userId));
    const [item] = await testDb
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartRow.id),
          eq(cartItems.variantId, product.variant.id),
        ),
      );

    expect(item.quantity).toBe(2);
  });

  test("adding two different variants of the same product creates two distinct lines", async ({
    page,
  }) => {
    const multiVariantProduct = await seedProductWithVariants({
      slug: "multi-variant-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 5 },
      ],
    });

    await page.goto(`/products/${multiVariantProduct.slug}`);
    await clickUntilHydrated(visible(page, "variant-pill-Size-S"), () =>
      expect(visible(page, "cart-control-add")).toBeVisible({ timeout: 1000 }),
    );
    await visible(page, "cart-control-add").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await visible(page, "variant-pill-Size-M").click();
    await visible(page, "cart-control-add").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("cart-trigger").click();
    const drawer = page.getByTestId("cart-drawer-content");

    const sRow = drawer
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("S", { exact: true }) });
    const mRow = drawer
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("M", { exact: true }) });

    await expect(sRow.getByTestId("cart-item-price")).toHaveText("$10.00");
    await expect(mRow.getByTestId("cart-item-price")).toHaveText("$12.00");
  });

  test("removing one variant's line doesn't affect the other", async ({
    page,
  }) => {
    const multiVariantProduct = await seedProductWithVariants({
      slug: "multi-variant-removal-product",
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { values: { Size: "S" }, price: 1000, stock: 5 },
        { values: { Size: "M" }, price: 1200, stock: 5 },
      ],
    });

    await page.goto(`/products/${multiVariantProduct.slug}`);
    await clickUntilHydrated(visible(page, "variant-pill-Size-S"), () =>
      expect(visible(page, "cart-control-add")).toBeVisible({ timeout: 1000 }),
    );
    await visible(page, "cart-control-add").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "1 in cart",
    );

    await visible(page, "variant-pill-Size-M").click();
    await visible(page, "cart-control-add").click();
    await visible(page, "cart-control-increment").click();
    await expect(visible(page, "cart-control-quantity")).toHaveText(
      "2 in cart",
    );

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByTestId("cart-trigger").click();
    const drawer = page.getByTestId("cart-drawer-content");

    const sRow = drawer
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("S", { exact: true }) });
    const mRow = drawer
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("M", { exact: true }) });

    await sRow.getByTestId("cart-control-decrement").click();
    await page.getByTestId("cart-remove-confirm-button").click();

    await expect(sRow).toHaveCount(0);
    await expect(mRow.getByTestId("cart-control-quantity")).toHaveText(
      "2 in cart",
    );
  });

  test("logging out resets cart UI immediately and keeps server cart on next sign-in", async ({
    page,
  }) => {
    await page.goto(`/products/${product.slug}`);
    await clickUntilHydrated(visible(page, "cart-control-add"), () =>
      expect(visible(page, "cart-control-quantity")).toHaveText("1 in cart", {
        timeout: 1000,
      }),
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("1");

    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("logout-menu-item").click();
    await expect(page.getByText("Log out?")).toBeVisible();
    await page.getByTestId("logout-confirm-button").click();

    await expect(page.getByTestId("signin-nav-button")).toBeVisible();
    await expect(page.getByTestId("cart-badge")).toHaveCount(0);
    await expect(visible(page, "cart-control-add")).toBeVisible();
    await expect(visible(page, "cart-control-quantity")).toHaveCount(0);

    await page.getByTestId("cart-trigger").click();
    await expect(page.getByTestId("cart-empty-state")).toBeVisible();
    await page.keyboard.press("Escape");

    const [cartRow] = await testDb
      .select()
      .from(cart)
      .where(eq(cart.userId, userId));
    const [dbItem] = await testDb
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartRow.id),
          eq(cartItems.variantId, product.variant.id),
        ),
      );
    expect(dbItem).toBeDefined();
    expect(dbItem.quantity).toBe(1);

    await signIn(page, credentials);
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await page.getByTestId("cart-trigger").click();
    await expect(page.getByTestId("cart-empty-state")).toHaveCount(0);
  });
});

