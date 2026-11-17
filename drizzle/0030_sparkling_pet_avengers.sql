CREATE TABLE "admin"."search_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"availableAt" timestamp with time zone DEFAULT now() NOT NULL,
	"leaseToken" uuid,
	"leaseExpiresAt" timestamp with time zone,
	"taskVersion" integer,
	"tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lastError" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_outbox_entity_type_check" CHECK ("admin"."search_outbox"."entityType" in ('product', 'category', 'order', 'customer', 'staff')),
	CONSTRAINT "search_outbox_entity_id_check" CHECK (length(btrim("admin"."search_outbox"."entityId")) > 0),
	CONSTRAINT "search_outbox_version_check" CHECK ("admin"."search_outbox"."version" >= 1),
	CONSTRAINT "search_outbox_attempts_check" CHECK ("admin"."search_outbox"."attempts" >= 0),
	CONSTRAINT "search_outbox_lease_check" CHECK (("admin"."search_outbox"."leaseToken" is null) = ("admin"."search_outbox"."leaseExpiresAt" is null)),
	CONSTRAINT "search_outbox_tasks_check" CHECK (jsonb_typeof("admin"."search_outbox"."tasks") = 'array'),
	CONSTRAINT "search_outbox_task_version_check" CHECK (
    ("admin"."search_outbox"."taskVersion" is null and "admin"."search_outbox"."tasks" = '[]'::jsonb)
    or ("admin"."search_outbox"."taskVersion" is not null and "admin"."search_outbox"."taskVersion" >= 1 and "admin"."search_outbox"."taskVersion" <= "admin"."search_outbox"."version")
  )
);
--> statement-breakpoint
CREATE TABLE "admin"."search_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"leaseToken" uuid NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"finishedAt" timestamp with time zone,
	"jobsProcessed" integer DEFAULT 0 NOT NULL,
	"jobsFailed" integer DEFAULT 0 NOT NULL,
	"documentsChecked" integer DEFAULT 0 NOT NULL,
	"documentsUpserted" integer DEFAULT 0 NOT NULL,
	"documentsDeleted" integer DEFAULT 0 NOT NULL,
	"lastError" text,
	CONSTRAINT "search_sync_runs_kind_check" CHECK ("admin"."search_sync_runs"."kind" in ('outbox', 'reconcile')),
	CONSTRAINT "search_sync_runs_status_check" CHECK ("admin"."search_sync_runs"."status" in ('running', 'succeeded', 'failed', 'interrupted')),
	CONSTRAINT "search_sync_runs_completion_check" CHECK (
    ("admin"."search_sync_runs"."status" = 'running' and "admin"."search_sync_runs"."finishedAt" is null)
    or ("admin"."search_sync_runs"."status" <> 'running' and "admin"."search_sync_runs"."finishedAt" is not null)
  ),
	CONSTRAINT "search_sync_runs_counts_check" CHECK (
    "admin"."search_sync_runs"."jobsProcessed" >= 0 and "admin"."search_sync_runs"."jobsFailed" >= 0
    and "admin"."search_sync_runs"."documentsChecked" >= 0 and "admin"."search_sync_runs"."documentsUpserted" >= 0
    and "admin"."search_sync_runs"."documentsDeleted" >= 0
  )
);
--> statement-breakpoint
CREATE TABLE "admin"."search_sync_leases" (
	"name" text PRIMARY KEY DEFAULT 'search-sync' NOT NULL,
	"ownerToken" uuid NOT NULL,
	"acquiredAt" timestamp with time zone DEFAULT now() NOT NULL,
	"renewedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	CONSTRAINT "search_sync_leases_name_check" CHECK ("admin"."search_sync_leases"."name" = 'search-sync')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "search_outbox_entity_unique" ON "admin"."search_outbox" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX "search_outbox_available_idx" ON "admin"."search_outbox" USING btree ("availableAt","createdAt","id");--> statement-breakpoint
CREATE INDEX "search_outbox_lease_idx" ON "admin"."search_outbox" USING btree ("leaseExpiresAt") WHERE "admin"."search_outbox"."leaseToken" is not null;--> statement-breakpoint
CREATE INDEX "search_sync_runs_started_idx" ON "admin"."search_sync_runs" USING btree ("startedAt","id");--> statement-breakpoint
CREATE INDEX "search_sync_runs_running_idx" ON "admin"."search_sync_runs" USING btree ("startedAt") WHERE "admin"."search_sync_runs"."status" = 'running';