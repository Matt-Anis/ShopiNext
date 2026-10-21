DROP INDEX "images_primary_idx";--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "images_productId_order_idx" ON "images" USING btree ("productId","order");--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN "isPrimary";