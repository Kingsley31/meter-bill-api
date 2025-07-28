CREATE TABLE "meter_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_number" varchar NOT NULL,
	"meter_id" uuid NOT NULL,
	"reading_date" timestamp NOT NULL,
	"kwh_reading" numeric NOT NULL,
	"kwh_consumption" numeric NOT NULL,
	"meter_image" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
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
CREATE TABLE "meter_tariffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_number" varchar NOT NULL,
	"meter_id" uuid NOT NULL,
	"tariff" numeric,
	"effective_from" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "meter_tariffs_meter_number_unique" UNIQUE("meter_number")
);
--> statement-breakpoint
CREATE TABLE "meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_number" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"area_id" uuid NOT NULL,
	"area_name" varchar NOT NULL,
	"location" varchar DEFAULT 'none' NOT NULL,
	"customer_id" uuid,
	"customer_name" varchar,
	"ct_rating" numeric NOT NULL,
	"ct_multiplier_factor" numeric NOT NULL,
	"purpose" varchar NOT NULL,
	"type" varchar NOT NULL,
	"calculation_reference_meter_id" uuid,
	"has_max_kwh_reading" boolean DEFAULT true NOT NULL,
	"max_kwh_reading" numeric,
	"tariff" numeric,
	"current_kwh_reading" numeric,
	"current_kwh_reading_date" timestamp,
	"current_kwh_consumption" numeric,
	"previous_kwh_reading" numeric,
	"previous_kwh_consumption" numeric,
	"previous_kwh_reading_date" timestamp,
	"last_bill_kwh_consumption" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "meters_meter_number_unique" UNIQUE("meter_number")
);
--> statement-breakpoint
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_sub_meters" ADD CONSTRAINT "meter_sub_meters_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_sub_meters" ADD CONSTRAINT "meter_sub_meters_sub_meter_id_meters_id_fk" FOREIGN KEY ("sub_meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_tariffs" ADD CONSTRAINT "meter_tariffs_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;