import { generateText, Output } from "ai";
import { z } from "zod/v4";
import type { TripLeg } from "@/types/domain";
import type { VisaRuleRow } from "@/lib/db/schema";

const suggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        description: z.string(),
        reasoning: z.string(),
        legs: z.array(
          z.object({
            countryCode: z.string().length(2),
            arrivalDate: z.string(),
            departureDate: z.string(),
          })
        ),
      })
    )
    .min(1)
    .max(3),
});

export type RouteSuggestions = z.infer<typeof suggestionSchema>;

export async function getRouteSuggestions(input: {
  currentLegs: TripLeg[];
  complianceIssues: string[];
  visaRules: VisaRuleRow[];
  passportNationality: string;
}): Promise<RouteSuggestions> {
  const { currentLegs, complianceIssues, visaRules, passportNationality } =
    input;

  const systemPrompt = `You are a visa compliance advisor for digital nomads. Given a travel itinerary with compliance violations, suggest 1-3 alternative routes that are compliant with visa rules.

Rules:
- Schengen zone (27 countries): Maximum 90 days in any 180-day rolling window for non-EU passport holders
- Each country has its own stay limit and visa requirements
- A stay limit of -1 means unlimited stay
- Preserve the traveler's general destinations and timeframe where possible
- Only adjust dates or swap countries to resolve violations
- Use ISO date format (YYYY-MM-DD)`;

  const userPrompt = `Passport nationality: ${passportNationality}

Current itinerary (with violations):
${JSON.stringify(currentLegs, null, 2)}

Compliance issues:
${complianceIssues.map((i) => `- ${i}`).join("\n")}

Relevant visa rules:
${JSON.stringify(
  visaRules.map((r) => ({
    country: r.countryCode,
    passport: r.passportNationality,
    stayLimit: r.stayLimitDays,
    windowDays: r.windowDays,
    visaType: r.visaType,
  })),
  null,
  2
)}

Suggest 1-3 compliant alternative itineraries. For each, explain what changed and why.`;

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: suggestionSchema }),
    system: systemPrompt,
    prompt: userPrompt,
  });

  if (!output) {
    throw new Error("AI failed to generate suggestions");
  }

  return output;
}
