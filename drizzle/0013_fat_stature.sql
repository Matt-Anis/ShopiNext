CREATE TABLE "product_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"optionId" uuid NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "product_option_values_optionId_value_unique" UNIQUE("optionId","value")
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productId" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "product_options_productId_name_unique" UNIQUE("productId","name")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"productId" uuid NOT NULL,
	"sku" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "variant_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variantId" uuid NOT NULL,
	"optionValueId" uuid NOT NULL,
	CONSTRAINT "variant_option_values_variantId_optionValueId_unique" UNIQUE("variantId","optionValueId")
);
--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cartId_productId_unique";--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_productId_products_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productId_products_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "variantId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variantId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_optionId_product_options_id_fk" FOREIGN KEY ("optionId") REFERENCES "public"."product_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_variantId_product_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_optionValueId_product_option_values_id_fk" FOREIGN KEY ("optionValueId") REFERENCES "public"."product_option_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_option_values_optionId_idx" ON "product_option_values" USING btree ("optionId");--> statement-breakpoint
CREATE INDEX "product_options_productId_idx" ON "product_options" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "product_variants_productId_idx" ON "product_variants" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "variant_option_values_optionValueId_idx" ON "variant_option_values" USING btree ("optionValueId");--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variantId_product_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_product_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN "productId";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "productId";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_variantId_unique" UNIQUE("cartId","variantId");