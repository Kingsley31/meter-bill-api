CREATE TABLE "meter_reading_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_reading_id" uuid NOT NULL,
	"reading_date" timestamp NOT NULL,
	"kwh_reading" numeric NOT NULL,
	"kwh_consumption" numeric NOT NULL,
	"meter_image" varchar NOT NULL,
	"reason" varchar NOT NULL,
	"previous_kwh_reading" numeric NOT NULL,
	"previous_kwh_consumption" numeric NOT NULL,
	"previous_kwh_reading_date" timestamp,
	"previous_meter_image" varchar NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meter_reading_updates" ADD CONSTRAINT "meter_reading_updates_meter_reading_id_meter_readings_id_fk" FOREIGN KEY ("meter_reading_id") REFERENCES "public"."meter_readings"("id") ON DELETE no action ON UPDATE no action;