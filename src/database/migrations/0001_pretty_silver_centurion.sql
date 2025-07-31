CREATE TABLE "customer_meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_number" varchar NOT NULL,
	"meter_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_phone" varchar,
	"customer_email" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "total_customers" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_meters" ADD CONSTRAINT "customer_meters_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;