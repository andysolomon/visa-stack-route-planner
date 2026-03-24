import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const visaRules = pgTable(
  "visa_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    countryCode: text("country_code").notNull(),
    passportNationality: text("passport_nationality").notNull(),
    stayLimitDays: integer("stay_limit_days").notNull(),
    windowDays: integer("window_days"),
    visaType: text("visa_type").notNull(),
    requiresVisa: boolean("requires_visa").notNull().default(false),
    notes: text("notes"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("visa_rules_country_passport_idx").on(
      table.countryCode,
      table.passportNationality
    ),
  ]
);

export type VisaRuleRow = typeof visaRules.$inferSelect;
export type NewVisaRule = typeof visaRules.$inferInsert;
