ALTER TABLE "auth"."sessions" ADD COLUMN "last_used_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "reuse_detected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "revoked_reason" varchar(120);