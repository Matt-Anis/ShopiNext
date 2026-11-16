import assert from "node:assert/strict";
import test from "node:test";
import { projectCategory } from "./categories";
import { descriptionToText } from "./description";
import { projectPublicProduct, type ProductProjectionSource } from "./products";

const product: ProductProjectionSource = {
  id: "product-id",
  name: "Cotton shirt",
  slug: "cotton-shirt",
  description: "A **soft** shirt.",
  isActive: true,
  status: "active",
  minPrice: 2_000,
  images: [{ url: "https://example.com/shirt.jpg" }],
  productCategories: [
    { category: { name: "Shirts", isActive: true } },
    { category: { name: "Private collection", isActive: false } },
    { category: { name: "Clothing", isActive: true } },
  ],
};

test("public products exclude drafts, trashed products, and unlisted products", () => {
  assert.equal(projectPublicProduct({ ...product, status: "draft" }), null);
  assert.equal(projectPublicProduct({ ...product, isActive: false }), null);
  assert.equal(projectPublicProduct({ ...product, minPrice: null }), null);
});

test("public documents allowlist fields and exclude trashed category names", () => {
  const source = { ...product, staffNote: "private", stock: 25 };
  assert.deepEqual(projectPublicProduct(source), {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: "A soft shirt.",
    thumbnailUrl: product.images[0].url,
    categoryNames: ["Clothing", "Shirts"],
  });
});

test("missing descriptions and images produce empty text and a null thumbnail", () => {
  const result = projectPublicProduct({
    ...product,
    description: null,
    images: [],
  });
  assert.equal(result?.description, "");
  assert.equal(result?.thumbnailUrl, null);
});

test("description text preserves table contents and removes markup and link destinations", () => {
  assert.equal(
    descriptionToText(
      "**Soft** [shirt](https://example.com)\n\n| Fabric |\n| --- |\n| Cotton |",
    ),
    "Soft shirt Fabric Cotton",
  );
});

test("trashed categories produce no search document", () => {
  assert.equal(
    projectCategory({
      id: "category-id",
      name: "Shirts",
      slug: "shirts",
      description: null,
      isActive: false,
    }),
    null,
  );
});
