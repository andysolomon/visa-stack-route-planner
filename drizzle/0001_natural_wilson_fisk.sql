CREATE TABLE "visa_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"passport_nationality" text NOT NULL,
	"stay_limit_days" integer NOT NULL,
	"window_days" integer,
	"visa_type" text NOT NULL,
	"requires_visa" boolean DEFAULT false NOT NULL,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "visa_rules_country_passport_idx" ON "visa_rules" USING btree ("country_code","passport_nationality");