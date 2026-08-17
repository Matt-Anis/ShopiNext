ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_productId_products_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;