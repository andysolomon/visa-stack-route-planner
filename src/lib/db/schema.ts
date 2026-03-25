import {
  boolean,
  date,
  integer,
  pgTable,
  real,
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

export const travelerProfiles = pgTable("traveler_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .unique()
    .notNull(),
  homeCountry: text("home_country").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TravelerProfileRow = typeof travelerProfiles.$inferSelect;
export type NewTravelerProfile = typeof travelerProfiles.$inferInsert;

export const passports = pgTable("passports", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .references(() => travelerProfiles.id, { onDelete: "cascade" })
    .notNull(),
  nationality: text("nationality").notNull(),
  expiryDate: date("expiry_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PassportRow = typeof passports.$inferSelect;
export type NewPassport = typeof passports.$inferInsert;

export const itineraries = pgTable("itineraries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ItineraryRow = typeof itineraries.$inferSelect;
export type NewItinerary = typeof itineraries.$inferInsert;

export const tripLegs = pgTable("trip_legs", {
  id: uuid("id").defaultRandom().primaryKey(),
  itineraryId: uuid("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  countryCode: text("country_code").notNull(),
  city: text("city"),
  arrivalDate: date("arrival_date").notNull(),
  departureDate: date("departure_date").notNull(),
  sortOrder: integer("sort_order").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type TripLegRow = typeof tripLegs.$inferSelect;
export type NewTripLeg = typeof tripLegs.$inferInsert;
