import { db } from "./index";
import { visaRules } from "./schema";
import seedData from "../data/visa-rules-seed.json";

async function seed() {
  console.log(`Seeding ${seedData.length} visa rules...`);

  const result = await db
    .insert(visaRules)
    .values(seedData)
    .onConflictDoUpdate({
      target: [visaRules.countryCode, visaRules.passportNationality],
      set: {
        stayLimitDays: visaRules.stayLimitDays,
        windowDays: visaRules.windowDays,
        visaType: visaRules.visaType,
        requiresVisa: visaRules.requiresVisa,
        notes: visaRules.notes,
        updatedAt: new Date(),
      },
    });

  console.log(`Seeded ${seedData.length} visa rules successfully.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
