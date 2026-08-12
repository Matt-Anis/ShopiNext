ALTER TABLE "products" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE INDEX "products_createdAt_id_idx" ON "products" USING btree ("createdAt","id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_slug_unique" UNIQUE("slug");