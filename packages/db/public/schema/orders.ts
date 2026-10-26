import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "../auth-schema";
import { productVariants } from "./variants";

export const orderStatusEnum = pgEnum("order_status", [
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export const orders = pgTable("orders", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text().references(() => user.id, { onDelete: "set null" }),
  checkoutEmail: text().notNull(),
  stripeSessionId: text().unique().notNull(),
  totalAmount: integer().notNull().default(0),
  status: orderStatusEnum("status").notNull(),
  archivedAt: timestamp(),
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

export const orderTimelineEvents = pgTable("order_timeline_events", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid()
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status"),
  note: text(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  timelineEvents: many(orderTimelineEvents),
}));

export const orderTimelineEventsRelations = relations(
  orderTimelineEvents,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderTimelineEvents.orderId],
      references: [orders.id],
    }),
  }),
);
