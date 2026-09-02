import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "./client";
import {
  categories,
  productCategories,
  products,
  images,
  productOptions,
  productOptionValues,
  productVariants,
  variantOptionValues,
} from "@repo/db/public/schema";
import { user, account } from "@repo/db/public/auth-schema";
import { seed, reset } from "drizzle-seed";

const SEEDED_USER_PASSWORD = "secret password";

const CATEGORY_NAMES = [
  "Electronics",
  "Kitchen",
  "Outdoor",
  "Fitness",
  "Books",
  "Toys",
  "Beauty",
  "Automotive",
  "Garden",
  "Furniture",
];

const picsumUrls = Array.from(
  { length: 300 },
  (_, i) => `https://picsum.photos/id/${i + 1}/800/600`,
);

const OPTION_POOLS = [
  { name: "Size", values: ["Small", "Medium", "Large", "XLarge"] },
  { name: "Color", values: ["Black", "White", "Red", "Blue", "Green"] },
  { name: "Material", values: ["Cotton", "Leather", "Wool", "Denim"] },
] as const;

function pickRandom<T>(arr: readonly T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((combo) => curr.map((item) => [...combo, item])),
    [[]],
  );
}

async function main() {
  await reset(db, {
    categories,
    productCategories,
    products,
    images,
    productOptions,
    productOptionValues,
    productVariants,
    variantOptionValues,
    user,
    account,
  });

  await seed(db, { categories }).refine((f) => ({
    categories: {
      count: CATEGORY_NAMES.length,
      columns: {
        name: f.valuesFromArray({ values: CATEGORY_NAMES, isUnique: true }),
        description: f.loremIpsum({ sentencesCount: 3 }),
      },
    },
  }));

  await seed(db, { products, images, user }).refine((f) => ({
    products: {
      count: 100,
      columns: {
        description: f.loremIpsum({ sentencesCount: 10 }),
      },
      with: {
        images: 3,
      },
    },
    images: {
      columns: {
        url: f.valuesFromArray({ values: picsumUrls }),
        altText: f.loremIpsum({ sentencesCount: 1 }),
        isPrimary: f.default({ defaultValue: false }),
      },
    },
    user: {
      count: 20,
      columns: {
        name: f.fullName(),
        email: f.email(),
      },
    },
  }));

  const seededCategories = await db
    .select({ id: categories.id })
    .from(categories);
  const seededProducts = await db
    .select({ id: products.id, slug: products.slug })
    .from(products);

  const productCategoryRows = seededProducts.flatMap((product) =>
    pickRandom(seededCategories, randomInt(1, 3)).map((category) => ({
      id: randomUUID(),
      productId: product.id,
      categoryId: category.id,
    })),
  );
  await db.insert(productCategories).values(productCategoryRows);

  const optionRows: (typeof productOptions.$inferInsert)[] = [];
  const optionValueRows: (typeof productOptionValues.$inferInsert)[] = [];
  const variantRows: (typeof productVariants.$inferInsert)[] = [];
  const variantOptionValueRows: (typeof variantOptionValues.$inferInsert)[] =
    [];
  let variantCount = 0;

  for (const product of seededProducts) {
    // 20% simple products (no options, one default variant), rest get 1-2 options.
    const optionCount = Math.random() < 0.2 ? 0 : randomInt(1, 2);
    const chosenPools = pickRandom(OPTION_POOLS, optionCount);

    const valuesByOption: { id: string; value: string }[][] = [];

    for (const pool of chosenPools) {
      const optionId = randomUUID();
      optionRows.push({ id: optionId, productId: product.id, name: pool.name });

      const chosenValues = pickRandom(pool.values, randomInt(2, 4));
      const values = chosenValues.map((value) => ({ id: randomUUID(), value }));
      values.forEach(({ id, value }) =>
        optionValueRows.push({ id, optionId, value }),
      );
      valuesByOption.push(values);
    }

    let combinations = cartesian(valuesByOption);

    if (combinations.length > 1) {
      const kept = combinations.filter(() => Math.random() > 0.25);
      combinations =
        kept.length > 0
          ? kept
          : [combinations[randomInt(0, combinations.length - 1)]];
    }

    const productSoldOut = Math.random() < 0.1;

    for (const combo of combinations) {
      const variantId = randomUUID();
      const skuSuffix =
        combo.length > 0
          ? "-" + combo.map((v) => v.value.toUpperCase()).join("-")
          : "";

      variantRows.push({
        id: variantId,
        productId: product.id,
        sku: `${product.slug.toUpperCase()}${skuSuffix}`,
        price: randomInt(999, 99999),
        stock: productSoldOut || Math.random() < 0.15 ? 0 : randomInt(1, 50),
        maxPerOrder: randomInt(1, 5),
      });

      combo.forEach(({ id: optionValueId }) =>
        variantOptionValueRows.push({
          id: randomUUID(),
          variantId,
          optionValueId,
        }),
      );
      variantCount++;
    }
  }

  if (optionRows.length > 0) await db.insert(productOptions).values(optionRows);
  if (optionValueRows.length > 0)
    await db.insert(productOptionValues).values(optionValueRows);
  await db.insert(productVariants).values(variantRows);
  if (variantOptionValueRows.length > 0)
    await db.insert(variantOptionValues).values(variantOptionValueRows);

  await db
    .update(images)
    .set({ isPrimary: true })
    .where(
      inArray(
        images.id,
        db
          .selectDistinctOn([images.productId], { id: images.id })
          .from(images)
          .orderBy(images.productId, images.id),
      ),
    );

  const passwordHash = await hashPassword(SEEDED_USER_PASSWORD);
  const seededUsers = await db.select({ id: user.id }).from(user);

  await db.insert(account).values(
    seededUsers.map(({ id }) => ({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: passwordHash,
    })),
  );

  console.log(
    `Seeded ${CATEGORY_NAMES.length} categories, 100 products with 300 images, ${variantCount} variants, and ${seededUsers.length} users (password: "${SEEDED_USER_PASSWORD}").`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
