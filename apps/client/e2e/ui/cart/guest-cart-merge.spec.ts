import { test, expect } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { cart, cartItems } from "@repo/db/public/schema";
import { user } from "@repo/db/public/auth-schema";
import { testDb } from "../../utils/db";
import { seedUser } from "../../utils/seed-user";
import { seedProduct } from "../../utils/seed-product";
import { clickUntilHydrated } from "../../utils/interaction";

test.describe("Guest cart merge on authentication", () => {
  test("merges guest cart items into empty user cart on sign-in", async ({
    page,
    request,
  }) => {
    const credentials = await seedUser(request);
    const [seededUser] = await testDb
      .select()
      .from(user)
      .where(eq(user.email, credentials.email));

    const product = await seedProduct();

    await page.goto("/");
    await clickUntilHydrated(
      page.getByTestId(`cart-control-add-${product.id}`),
      () =>
        expect(
          page.getByTestId(`cart-control-quantity-${product.id}`),
        ).toHaveText("1 in cart", { timeout: 1000 }),
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await expect(
      page.getByTestId(`cart-control-decrement-${product.id}`),
    ).toBeEnabled();

    const cookiesBefore = await page.context().cookies();
    const guestCartCookieBefore = cookiesBefore.find((c) => c.name === "cart");
    expect(guestCartCookieBefore).toBeDefined();

    await page.goto("/login");
    await page.getByTestId("login-email-input").fill(credentials.email);
    await page.getByTestId("login-password-input").fill(credentials.password);
    await page.getByTestId("login-submit-button").click();

    await expect(page.getByText("Signed in successfully")).toBeVisible();
    await page.waitForURL("/");

    const cookiesAfter = await page.context().cookies();
    const guestCartCookieAfter = cookiesAfter.find((c) => c.name === "cart");
    expect(guestCartCookieAfter).toBeUndefined();

    await expect(page.getByTestId("cart-badge")).toHaveText("1");

    const [cartRow] = await testDb
      .select()
      .from(cart)
      .where(eq(cart.userId, seededUser.id));
    expect(cartRow).toBeDefined();

    const [item] = await testDb
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartRow.id),
          eq(cartItems.variantId, product.variant.id),
        ),
      );
    expect(item).toBeDefined();
    expect(item.quantity).toBe(1);
  });

  test("merges distinct items from guest cart with existing user cart", async ({
    page,
    request,
  }) => {
    const credentials = await seedUser(request);
    const [seededUser] = await testDb
      .select()
      .from(user)
      .where(eq(user.email, credentials.email));

    const productA = await seedProduct();
    const productB = await seedProduct();

    const [cartRow] = await testDb
      .insert(cart)
      .values({ userId: seededUser.id })
      .returning();

    await testDb.insert(cartItems).values({
      cartId: cartRow.id,
      variantId: productA.variant.id,
      quantity: 1,
    });

    await page.goto("/");
    await clickUntilHydrated(
      page.getByTestId(`cart-control-add-${productB.id}`),
      () =>
        expect(
          page.getByTestId(`cart-control-quantity-${productB.id}`),
        ).toHaveText("1 in cart", { timeout: 1000 }),
    );
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
    await expect(
      page.getByTestId(`cart-control-decrement-${productB.id}`),
    ).toBeEnabled();

    await page.goto("/login");
    await page.getByTestId("login-email-input").fill(credentials.email);
    await page.getByTestId("login-password-input").fill(credentials.password);
    await page.getByTestId("login-submit-button").click();

    await expect(page.getByText("Signed in successfully")).toBeVisible();
    await page.waitForURL("/");

    const cookiesAfter = await page.context().cookies();
    const guestCartCookieAfter = cookiesAfter.find((c) => c.name === "cart");
    expect(guestCartCookieAfter).toBeUndefined();

    await expect(page.getByTestId("cart-badge")).toHaveText("2");

    const dbItems = await testDb
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartRow.id));
    expect(dbItems).toHaveLength(2);

    const itemA = dbItems.find((i) => i.variantId === productA.variant.id);
    const itemB = dbItems.find((i) => i.variantId === productB.variant.id);
    expect(itemA?.quantity).toBe(1);
    expect(itemB?.quantity).toBe(1);
  });

  test("combines quantities of identical variant and clamps to maxPerOrder", async ({
    page,
    request,
  }) => {
    const credentials = await seedUser(request);
    const [seededUser] = await testDb
      .select()
      .from(user)
      .where(eq(user.email, credentials.email));

    const product = await seedProduct({ stock: 10, maxPerOrder: 3 });

    const [cartRow] = await testDb
      .insert(cart)
      .values({ userId: seededUser.id })
      .returning();

    await testDb.insert(cartItems).values({
      cartId: cartRow.id,
      variantId: product.variant.id,
      quantity: 2,
    });

    await page.goto("/");
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
    await expect(
      page.getByTestId(`cart-control-decrement-${product.id}`),
    ).toBeEnabled();

    await page.goto("/login");
    await page.getByTestId("login-email-input").fill(credentials.email);
    await page.getByTestId("login-password-input").fill(credentials.password);
    await page.getByTestId("login-submit-button").click();

    await expect(page.getByText("Signed in successfully")).toBeVisible();
    await page.waitForURL("/");

    const cookiesAfter = await page.context().cookies();
    const guestCartCookieAfter = cookiesAfter.find((c) => c.name === "cart");
    expect(guestCartCookieAfter).toBeUndefined();

    await expect(page.getByTestId("cart-badge")).toHaveText("3");

    const [mergedItem] = await testDb
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartRow.id),
          eq(cartItems.variantId, product.variant.id),
        ),
      );
    expect(mergedItem.quantity).toBe(3);
  });

  test("does not modify cart when guest cart is empty on login", async ({
    page,
    request,
  }) => {
    const credentials = await seedUser(request);
    const [seededUser] = await testDb
      .select()
      .from(user)
      .where(eq(user.email, credentials.email));

    const product = await seedProduct();

    const [cartRow] = await testDb
      .insert(cart)
      .values({ userId: seededUser.id })
      .returning();

    await testDb.insert(cartItems).values({
      cartId: cartRow.id,
      variantId: product.variant.id,
      quantity: 1,
    });

    await page.goto("/login");
    await page.getByTestId("login-email-input").fill(credentials.email);
    await page.getByTestId("login-password-input").fill(credentials.password);
    await page.getByTestId("login-submit-button").click();

    await expect(page.getByText("Signed in successfully")).toBeVisible();
    await page.waitForURL("/");

    await expect(page.getByTestId("cart-badge")).toHaveText("1");

    const [item] = await testDb
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartRow.id),
          eq(cartItems.variantId, product.variant.id),
        ),
      );
    expect(item.quantity).toBe(1);
  });
});
