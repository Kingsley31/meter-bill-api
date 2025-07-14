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
ALTER TABLE "meters" ADD COLUMN "current_kwh_consumption" numeric;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "previous_kwh_reading" numeric;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "previous_kwh_consumption" numeric;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "previous_kwh_reading_date" timestamp;--> statement-breakpoint
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;