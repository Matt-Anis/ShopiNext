ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkoutEmail" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stripeSessionId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_stripeSessionId_unique" UNIQUE("stripeSessionId");