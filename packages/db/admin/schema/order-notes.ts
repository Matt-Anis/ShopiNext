import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "../../public/schema/orders";
import { adminUser } from "../auth-schema";
import { adminSchema } from "./base";

export const adminOrderNotes = adminSchema.table("order_notes", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid()
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  adminUserId: text()
    .notNull()
    .references(() => adminUser.id, { onDelete: "cascade" }),
  content: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const adminOrderNotesRelations = relations(
  adminOrderNotes,
  ({ one }) => ({
    order: one(orders, {
      fields: [adminOrderNotes.orderId],
      references: [orders.id],
    }),
    author: one(adminUser, {
      fields: [adminOrderNotes.adminUserId],
      references: [adminUser.id],
    }),
  }),
);
