CREATE TYPE "public"."product_code" AS ENUM('SCC', 'SCA', 'CERTIFICAX');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."customer_contract_product_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "platform"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "product_code" NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" varchar(255),
	"status" "product_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "platform"."customer_contract_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_contract_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"status" "customer_contract_product_status" DEFAULT 'ACTIVE' NOT NULL,
	"starts_at" date,
	"ends_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "platform"."customer_contract_products" ADD CONSTRAINT "customer_contract_products_customer_contract_id_customer_contracts_id_fk" FOREIGN KEY ("customer_contract_id") REFERENCES "platform"."customer_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."customer_contract_products" ADD CONSTRAINT "customer_contract_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "platform"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "products_code_uq" ON "platform"."products" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_contract_products_contract_product_uq" ON "platform"."customer_contract_products" USING btree ("customer_contract_id","product_id");--> statement-breakpoint
CREATE INDEX "customer_contract_products_contract_idx" ON "platform"."customer_contract_products" USING btree ("customer_contract_id");--> statement-breakpoint
CREATE INDEX "customer_contract_products_product_idx" ON "platform"."customer_contract_products" USING btree ("product_id");
