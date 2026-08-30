import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "../auth-schema";
import { productVariants } from "./variants";

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
