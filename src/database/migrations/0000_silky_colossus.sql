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
CREATE TABLE "meter_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_number" varchar NOT NULL,
	"meter_id" uuid NOT NULL,
	"reading_date" timestamp NOT NULL,
	"kwh_reading" numeric NOT NULL,
	"prev_kwh_reading" numeric DEFAULT '0' NOT NULL,
	"prev_kwh_reading_id" uuid,
	"kwh_consumption" numeric NOT NULL,
	"tariff_id" uuid,
	"tariff" numeric,
	"tariff_type" varchar,
	"tariff_effective_date" timestamp,
	"tariff_end_date" timestamp,
	"amount" numeric,
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
CREATE TABLE "meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_number" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"area_id" uuid NOT NULL,
	"area_name" varchar NOT NULL,
	"location" varchar DEFAULT 'none' NOT NULL,
	"customer_id" uuid,
	"customer_name" varchar,
	"total_customers" numeric DEFAULT '0' NOT NULL,
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
	"last_bill_date" timestamp,
	"last_bill_amount" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "meters_meter_number_unique" UNIQUE("meter_number")
);
--> statement-breakpoint
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
CREATE TABLE "area_leaders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_name" varchar NOT NULL,
	"area_id" uuid NOT NULL,
	"leader_id" uuid NOT NULL,
	"leader_name" varchar NOT NULL,
	"leader_phone" varchar,
	"leader_email" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_name" varchar NOT NULL,
	"address" varchar NOT NULL,
	"city" varchar NOT NULL,
	"state" varchar NOT NULL,
	"country" varchar NOT NULL,
	"total_meters" numeric DEFAULT '0' NOT NULL,
	"type" varchar,
	"current_tariff" numeric,
	"total_kwh_reading" numeric,
	"total_kwh_consumption" numeric,
	"last_bill_kwh_consumption" numeric,
	"last_bill_date" timestamp,
	"last_bill_amount" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "area_tariffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"area_name" varchar NOT NULL,
	"area_id" uuid NOT NULL,
	"tariff" numeric,
	"effective_from" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "meter_tariffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_number" varchar NOT NULL,
	"meter_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"tariff" numeric,
	"effective_from" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bill_breakdowns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"meter_id" varchar NOT NULL,
	"area_id" varchar NOT NULL,
	"location" varchar NOT NULL,
	"area_name" varchar NOT NULL,
	"meter_number" varchar NOT NULL,
	"last_read_date" timestamp NOT NULL,
	"first_read_date" timestamp NOT NULL,
	"first_read_kwh" numeric NOT NULL,
	"last_read_kwh" numeric NOT NULL,
	"total_consumption" numeric NOT NULL,
	"tariff" numeric NOT NULL,
	"total_amount" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_generation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"x_request_id" varchar NOT NULL,
	"requested_by_user_id" text NOT NULL,
	"requested_by_user_name" text NOT NULL,
	"request_date" timestamp DEFAULT now() NOT NULL,
	"completed_date" timestamp,
	"scope" varchar NOT NULL,
	"is_consolidated" boolean DEFAULT false NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"recipient_type" varchar NOT NULL,
	"recipient_id" uuid,
	"area_id" uuid,
	"area_name" varchar,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text,
	CONSTRAINT "bill_generation_requests_x_request_id_unique" UNIQUE("x_request_id")
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar NOT NULL,
	"request_id" varchar NOT NULL,
	"generate_by_user_id" varchar NOT NULL,
	"generate_by_user_name" varchar NOT NULL,
	"pdf_generated" boolean DEFAULT false NOT NULL,
	"pdf_url" text DEFAULT '',
	"total_amount_due" numeric NOT NULL,
	"is_consolidated" boolean DEFAULT false NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"recipient_type" varchar NOT NULL,
	"scope" varchar NOT NULL,
	"area_id" uuid,
	"area_name" varchar,
	"payment_status" varchar DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bills_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "invoice_sequences" (
	"date" date PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"phone_number" varchar,
	"email" varchar NOT NULL,
	"bill_id" uuid NOT NULL,
	"bill_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meter_reading_updates" ADD CONSTRAINT "meter_reading_updates_meter_reading_id_meter_readings_id_fk" FOREIGN KEY ("meter_reading_id") REFERENCES "public"."meter_readings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_sub_meters" ADD CONSTRAINT "meter_sub_meters_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_sub_meters" ADD CONSTRAINT "meter_sub_meters_sub_meter_id_meters_id_fk" FOREIGN KEY ("sub_meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_meters" ADD CONSTRAINT "customer_meters_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_leaders" ADD CONSTRAINT "area_leaders_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_breakdowns" ADD CONSTRAINT "bill_breakdowns_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;