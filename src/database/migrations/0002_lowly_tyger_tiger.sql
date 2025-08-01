ALTER TABLE "meters" ADD COLUMN "last_bill_date" timestamp;--> statement-breakpoint
ALTER TABLE "meters" ADD COLUMN "last_bill_amount" numeric;