ALTER TABLE "bill_generation_requests" ALTER COLUMN "request_date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bill_generation_requests" ALTER COLUMN "request_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bill_generation_requests" ADD COLUMN "completed_date" timestamp;