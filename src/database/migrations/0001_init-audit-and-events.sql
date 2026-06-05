CREATE TABLE "platform"."audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"actor_type" varchar(40) DEFAULT 'USER' NOT NULL,
	"action" varchar(160) NOT NULL,
	"resource_type" varchar(120) NOT NULL,
	"resource_id" varchar(120),
	"http_method" varchar(12),
	"http_path" varchar(500),
	"ip_address" varchar(80),
	"user_agent" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_type" varchar(120) NOT NULL,
	"aggregate_id" varchar(120) NOT NULL,
	"event_type" varchar(160) NOT NULL,
	"event_version" integer DEFAULT 1 NOT NULL,
	"payload" jsonb NOT NULL,
	"headers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(40) DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"last_error" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "platform"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "platform"."audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "platform"."audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_occurred_at_idx" ON "platform"."audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "platform"."audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "outbox_events_aggregate_idx" ON "platform"."outbox_events" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "outbox_events_event_type_idx" ON "platform"."outbox_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "outbox_events_status_available_at_idx" ON "platform"."outbox_events" USING btree ("status","available_at");