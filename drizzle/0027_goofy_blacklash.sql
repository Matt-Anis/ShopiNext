CREATE TABLE "admin"."order_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orderId" uuid NOT NULL,
	"adminUserId" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_timeline_events" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "admin"."order_notes" ADD CONSTRAINT "order_notes_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin"."order_notes" ADD CONSTRAINT "order_notes_adminUserId_admin_user_id_fk" FOREIGN KEY ("adminUserId") REFERENCES "admin"."admin_user"("id") ON DELETE cascade ON UPDATE no action;