CREATE TABLE "meter_sub_meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_id" uuid NOT NULL,
	"sub_meter_id" uuid NOT NULL,
	"operator" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "meters" RENAME COLUMN "meter_id" TO "meter_number";--> statement-breakpoint
ALTER TABLE "meters" DROP CONSTRAINT "meters_meter_id_unique";--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "area_id" uuid;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "area_name" varchar;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "customer_name" varchar;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "ct_rating" numeric NOT NULL;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "ct_multiplier_factor" numeric NOT NULL;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "purpose" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "type" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "calculation_reference_meter_id" uuid;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "has_max_kwh_reading" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "max_kwh_reading" numeric;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "tariff" numeric;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "current_kwh_reading" numeric;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "last_bill_kwh_consumption" numeric;--> statement-breakpoint
ALTER TABLE "meters" ADD CONSTRAINT "meters_meter_number_unique" UNIQUE("meter_number");