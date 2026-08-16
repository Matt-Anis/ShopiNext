import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { testDb } from "../../utils/db";
import { cart, cartItems } from "@/db/schema";
import { resetAuthTables, resetCartTables } from "../../utils/db-reset";
import { seedUser, DEFAULT_TEST_USER } from "../../utils/seed-user";
import { seedProduct } from "../../utils/seed-product";
import { createTestCheckoutSession } from "../../utils/checkout";

test.beforeEach(async () => {
  await resetCartTables();
  await resetAuthTables();
});

const CART_COOKIE = { name: "cart", domain: "localhost", path: "/" };

test.describe("GET /api/checkout/complete", () => {
  test("clears the guest cart cookie for a cart checkout", async ({
    page,
  }) => {
    const product = await seedProduct();
    await page.context().addCookies([
      {
        ...CART_COOKIE,
        value: JSON.stringify([{ productId: product.id, quantity: 1 }]),
      },
    ]);

    const session = await createTestCheckoutSession({
      productId: product.id,
      unitAmount: product.price,
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
        value: JSON.stringify([{ productId: product.id, quantity: 1 }]),
      },
    ]);

    const session = await createTestCheckoutSession({
      productId: product.id,
      unitAmount: product.price,
      source: "buy-now",
    });

    await page.goto(`/api/checkout/complete?session_id=${session.id}`);

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "cart")).toBeTruthy();
  });

  test("clears the DB cart for a logged in cart checkout, redundant with the webhook", async ({
    request,
  }) => {
    const credentials = await seedUser(request);
    const [seededUser] = await testDb.query.user.findMany({
      where: (fields, { eq }) => eq(fields.email, credentials.email),
    });
    const product = await seedProduct();

    const [seededCart] = await testDb
      .insert(cart)
      .values({ userId: seededUser.id })
      .returning();
    await testDb
      .insert(cartItems)
      .values({ cartId: seededCart.id, productId: product.id, quantity: 1 });

    const session = await createTestCheckoutSession({
      productId: product.id,
      unitAmount: product.price,
      userId: seededUser.id,
      source: "cart",
    });

    await request.get(`/api/checkout/complete?session_id=${session.id}`);

    const remaining = await testDb
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, seededCart.id));
    expect(remaining).toHaveLength(0);
  });

  test("leaves the DB cart alone for a logged in buy-now checkout", async ({
    request,
  }) => {
    const credentials = await seedUser(request, {
      email: DEFAULT_TEST_USER.email,
    });
    const [seededUser] = await testDb.query.user.findMany({
      where: (fields, { eq }) => eq(fields.email, credentials.email),
    });
    const product = await seedProduct();

    const [seededCart] = await testDb
      .insert(cart)
      .values({ userId: seededUser.id })
      .returning();
    await testDb
      .insert(cartItems)
      .values({ cartId: seededCart.id, productId: product.id, quantity: 1 });

    const session = await createTestCheckoutSession({
      productId: product.id,
      unitAmount: product.price,
      userId: seededUser.id,
      source: "buy-now",
    });

    await request.get(`/api/checkout/complete?session_id=${session.id}`);

    const remaining = await testDb
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, seededCart.id));
    expect(remaining).toHaveLength(1);
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
