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
