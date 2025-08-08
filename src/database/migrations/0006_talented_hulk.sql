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
ALTER TABLE "area_leaders" ADD CONSTRAINT "area_leaders_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;