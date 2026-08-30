import {
  boolean,
  integer,
  pgTable,
  text,
  uuid,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { adminUser } from "../admin/auth-schema";
import { relations, sql } from "drizzle-orm";

export const products = pgTable(
  "products",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().unique().notNull(),
    description: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("products_createdAt_id_idx").on(table.createdAt, table.id)],
);

export const productOptions = pgTable(
  "product_options",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text().notNull(),
  },
  (table) => [
    unique("product_options_productId_name_unique").on(
      table.productId,
      table.name,
    ),
    index("product_options_productId_idx").on(table.productId),
  ],
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid().primaryKey().defaultRandom(),
    optionId: uuid()
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    value: text().notNull(),
  },
  (table) => [
    unique("product_option_values_optionId_value_unique").on(
      table.optionId,
      table.value,
    ),
    index("product_option_values_optionId_idx").on(table.optionId),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text().unique().notNull(),
    price: integer().notNull().default(0),
    stock: integer().notNull().default(0),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("product_variants_productId_idx").on(table.productId)],
);

export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    id: uuid().primaryKey().defaultRandom(),
    variantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionValueId: uuid()
      .notNull()
      .references(() => productOptionValues.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("variant_option_values_variantId_optionValueId_unique").on(
      table.variantId,
      table.optionValueId,
    ),
    index("variant_option_values_optionValueId_idx").on(table.optionValueId),
  ],
);

export const images = pgTable(
  "images",
  {
    id: uuid().primaryKey().defaultRandom(),
    url: text().notNull(),
    altText: text(),
    isPrimary: boolean().notNull().default(false),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("images_productId_idx").on(table.productId),
    index("images_primary_idx")
      .on(table.productId)
      .where(sql`${table.isPrimary} = true`),
  ],
);

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().unique().notNull(),
  description: text(),
  updatedBy: text().references(() => adminUser.id, { onDelete: "set null" }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("product_categories_productId_categoryId_unique").on(
      table.productId,
      table.categoryId,
    ),
    index("product_categories_categoryId_idx").on(table.categoryId),
  ],
);

export const cart = pgTable("cart", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp().defaultNow().notNull(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    cartId: uuid()
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    variantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer().notNull().default(1),
  },
  (table) => [
    unique("cart_items_cartId_variantId_unique").on(
      table.cartId,
      table.variantId,
    ),
  ],
);

export const orders = pgTable("orders", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text().references(() => user.id, { onDelete: "set null" }),
  checkoutEmail: text().notNull(),
  stripeSessionId: text().unique().notNull(),
  totalAmount: integer().notNull().default(0),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid()
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: uuid()
    .notNull()
    .references(() => productVariants.id),
  priceAtPurchase: integer().notNull(),
  quantity: integer().notNull().default(1),
});

export const productsRelations = relations(products, ({ many }) => ({
  images: many(images),
  productCategories: many(productCategories),
  options: many(productOptions),
  variants: many(productVariants),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  product: one(products, {
    fields: [images.productId],
    references: [products.id],
  }),
}));

export const productOptionsRelations = relations(
  productOptions,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productOptions.productId],
      references: [products.id],
    }),
    values: many(productOptionValues),
  }),
);

export const productOptionValuesRelations = relations(
  productOptionValues,
  ({ one, many }) => ({
    option: one(productOptions, {
      fields: [productOptionValues.optionId],
      references: [productOptions.id],
    }),
    variantOptionValues: many(variantOptionValues),
  }),
);

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    variantOptionValues: many(variantOptionValues),
  }),
);

export const variantOptionValuesRelations = relations(
  variantOptionValues,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [variantOptionValues.variantId],
      references: [productVariants.id],
    }),
    optionValue: one(productOptionValues, {
      fields: [variantOptionValues.optionValueId],
      references: [productOptionValues.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  productCategories: many(productCategories),
  updatedByAdmin: one(adminUser, {
    fields: [categories.updatedBy],
    references: [adminUser.id],
  }),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const cartRelations = relations(cart, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(cart, {
    fields: [cartItems.cartId],
    references: [cart.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));
