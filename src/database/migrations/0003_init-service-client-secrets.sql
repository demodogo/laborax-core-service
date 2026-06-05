CREATE TABLE "auth"."service_client_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_client_id" uuid NOT NULL,
	"secret_hash" text NOT NULL,
	"version" integer NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"replaced_by_secret_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."service_client_secrets" ADD CONSTRAINT "service_client_secrets_service_client_id_service_clients_id_fk" FOREIGN KEY ("service_client_id") REFERENCES "auth"."service_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "service_client_secret_version_uq" ON "auth"."service_client_secrets" USING btree ("service_client_id","version");--> statement-breakpoint
CREATE INDEX "service_client_secret_service_client_idx" ON "auth"."service_client_secrets" USING btree ("service_client_id");--> statement-breakpoint
CREATE INDEX "service_client_secret_is_primary_idx" ON "auth"."service_client_secrets" USING btree ("service_client_id","is_primary");--> statement-breakpoint
ALTER TABLE "auth"."service_clients" DROP COLUMN "client_secret_hash";