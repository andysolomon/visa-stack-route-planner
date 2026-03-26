CREATE TABLE "visa_rule_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"field" text NOT NULL,
	"old_value" text NOT NULL,
	"new_value" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visa_rule_changes" ADD CONSTRAINT "visa_rule_changes_rule_id_visa_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."visa_rules"("id") ON DELETE no action ON UPDATE no action;