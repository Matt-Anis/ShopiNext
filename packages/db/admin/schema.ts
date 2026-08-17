import { pgSchema } from "drizzle-orm/pg-core";

export const adminSchema = pgSchema("admin");

// No admin-only tables yet.
