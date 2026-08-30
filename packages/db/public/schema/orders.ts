import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "../auth-schema";
import { productVariants } from "./variants";

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
