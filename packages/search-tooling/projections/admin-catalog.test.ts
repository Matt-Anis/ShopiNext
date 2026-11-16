import assert from "node:assert/strict";
import test from "node:test";
import {
  projectAdminProduct,
  type AdminProductProjectionSource,
} from "./admin-products";
import { projectOrder } from "./orders";

const product: AdminProductProjectionSource = {
  id: "product-id",
  name: "Cotton shirt",
  slug: "cotton-shirt",
  description: "A **soft** shirt.",
  isActive: false,
  status: "draft",
  minPrice: null,
  images: [],
  productCategories: [
    { category: { name: "Trashed category", isActive: false } },
  ],
  variants: [
    { sku: "SHIRT-B", isActive: true },
    { sku: "SHIRT-OLD", isActive: false },
    { sku: "SHIRT-A", isActive: true },
  ],
};

test("admin products retain draft and trash state without public eligibility filtering", () => {
  const result = projectAdminProduct(product);
  assert.equal(result.status, "draft");
  assert.equal(result.isActive, false);
  assert.deepEqual(result.categoryNames, ["Trashed category"]);
  assert.equal("minPrice" in result, false);
});

test("only non-trashed variant SKUs contribute to admin product documents", () => {
  assert.deepEqual(projectAdminProduct(product).skus, ["SHIRT-A", "SHIRT-B"]);
});

test("order documents preserve checkout identity and archive state without provider metadata", () => {
  const createdAt = new Date("2026-11-01T10:00:00Z");
  const archivedAt = new Date("2026-11-02T10:00:00Z");
  const order = {
    id: "12345678-1234-4234-8234-123456789012",
    checkoutEmail: "guest@example.com",
    status: "paid" as const,
    totalAmount: 2_000,
    createdAt,
    archivedAt,
    stripeSessionId: "private-provider-id",
    userId: null,
  };

  assert.deepEqual(projectOrder(order), {
    id: order.id,
    reference: "12345678",
    checkoutEmail: order.checkoutEmail,
    status: "paid",
    totalAmount: 2_000,
    createdAt: createdAt.toISOString(),
    archivedAt: archivedAt.toISOString(),
  });
});
