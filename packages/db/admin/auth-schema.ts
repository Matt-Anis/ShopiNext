import { relations } from "drizzle-orm";
import { text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { adminSchema } from "./schema";

export const adminUser = adminSchema.table("admin_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const adminSession = adminSchema.table(
  "admin_session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => adminUser.id, { onDelete: "cascade" }),
  },
  (table) => [index("adminSession_userId_idx").on(table.userId)],
);

export const adminAccount = adminSchema.table(
  "admin_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => adminUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("adminAccount_userId_idx").on(table.userId)],
);

export const adminVerification = adminSchema.table(
  "admin_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("adminVerification_identifier_idx").on(table.identifier)],
);

export const adminUserRelations = relations(adminUser, ({ many }) => ({
  adminSessions: many(adminSession),
  adminAccounts: many(adminAccount),
}));

export const adminSessionRelations = relations(adminSession, ({ one }) => ({
  adminUser: one(adminUser, {
    fields: [adminSession.userId],
    references: [adminUser.id],
  }),
}));

export const adminAccountRelations = relations(adminAccount, ({ one }) => ({
  adminUser: one(adminUser, {
    fields: [adminAccount.userId],
    references: [adminUser.id],
  }),
}));
