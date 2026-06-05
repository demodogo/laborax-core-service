ALTER TABLE "platform"."companies" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."company_type";--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('OWNER', 'CONTRACTOR', 'SUBCONTRACTOR', 'EST');--> statement-breakpoint
ALTER TABLE "platform"."companies" ALTER COLUMN "type" SET DATA TYPE "public"."company_type" USING "type"::"public"."company_type";