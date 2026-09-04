ALTER TABLE "products" DROP CONSTRAINT "products_slug_unique";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_sku_unique";--> statement-breakpoint
DROP INDEX "products_createdAt_id_idx";--> statement-breakpoint
DROP INDEX "products_minPrice_id_idx";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "isActive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_active_unique" ON "products" USING btree ("slug") WHERE "products"."isActive";--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_active_unique" ON "categories" USING btree ("name") WHERE "categories"."isActive";--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_active_unique" ON "product_variants" USING btree ("sku") WHERE "product_variants"."isActive";--> statement-breakpoint
CREATE INDEX "products_createdAt_id_idx" ON "products" USING btree ("createdAt","id") WHERE "products"."isActive";--> statement-breakpoint
CREATE INDEX "products_minPrice_id_idx" ON "products" USING btree ("minPrice","id") WHERE "products"."minPrice" is not null and "products"."isActive";