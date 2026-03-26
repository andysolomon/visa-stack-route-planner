const TWO_YEARS_MS = 2 * 365 * 86_400_000;
const SIX_MONTHS_MS = 6 * 30 * 86_400_000;

export function warnDistantPast(dateStr: string): string | null {
  const date = new Date(dateStr + "T00:00:00Z");
  const diff = Date.now() - date.getTime();
  if (diff > TWO_YEARS_MS) {
    return `Date ${dateStr} is more than 2 years in the past`;
  }
  return null;
}

export function warnPassportExpiry(expiryDate: string | null): string | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate + "T00:00:00Z");
  const diff = expiry.getTime() - Date.now();
  if (diff < SIX_MONTHS_MS && diff > 0) {
    return `Passport expires within 6 months (${expiryDate})`;
  }
  if (diff <= 0) {
    return `Passport is expired (${expiryDate})`;
  }
  return null;
}

export function checkOverlap(
  existingLegs: Array<{ arrivalDate: string; departureDate: string }>,
  newLeg: { arrivalDate: string; departureDate: string }
): string | null {
  const newStart = new Date(newLeg.arrivalDate + "T00:00:00Z").getTime();
  const newEnd = new Date(newLeg.departureDate + "T00:00:00Z").getTime();

  for (const leg of existingLegs) {
    const start = new Date(leg.arrivalDate + "T00:00:00Z").getTime();
    const end = new Date(leg.departureDate + "T00:00:00Z").getTime();
    if (newStart <= end && newEnd >= start) {
      return `Dates overlap with existing leg (${leg.arrivalDate} to ${leg.departureDate})`;
    }
  }
  return null;
}
