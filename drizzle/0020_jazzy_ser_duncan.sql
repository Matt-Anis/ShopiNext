DROP INDEX "products_createdAt_id_idx";--> statement-breakpoint
DROP INDEX "products_minPrice_id_idx";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
CREATE INDEX "products_createdAt_id_idx" ON "products" USING btree ("createdAt","id") WHERE "products"."isActive" and "products"."status" = 'active';--> statement-breakpoint
CREATE INDEX "products_minPrice_id_idx" ON "products" USING btree ("minPrice","id") WHERE "products"."minPrice" is not null and "products"."isActive" and "products"."status" = 'active';--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_status_check" CHECK ("products"."status" in ('draft', 'active'));