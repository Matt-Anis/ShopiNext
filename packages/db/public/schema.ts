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
    price: integer().notNull().default(0),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("products_createdAt_id_idx").on(table.createdAt, table.id)],
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
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer().notNull().default(1),
  },
  (table) => [
    unique("cart_items_cartId_productId_unique").on(
      table.cartId,
      table.productId,
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
  productId: uuid()
    .notNull()
    .references(() => products.id),
  priceAtPurchase: integer().notNull(),
  quantity: integer().notNull().default(1),
});

export const productsRelations = relations(products, ({ many }) => ({
  images: many(images),
  productCategories: many(productCategories),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  product: one(products, {
    fields: [images.productId],
    references: [products.id],
  }),
}));

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
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));
