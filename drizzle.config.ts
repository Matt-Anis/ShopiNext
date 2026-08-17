import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  out: "./drizzle",
  schema: [
    "./packages/db/public/schema.ts",
    "./packages/db/public/auth-schema.ts",
    "./packages/db/admin/schema.ts",
    "./packages/db/admin/auth-schema.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
