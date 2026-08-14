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
import { user } from "@/lib/auth-schema";
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
      .references(() => products.id),
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
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
}));

export const imagesRelations = relations(images, ({ one }) => ({
  product: one(products, {
    fields: [images.productId],
    references: [products.id],
  }),
}));
