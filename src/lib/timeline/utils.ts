function parseDate(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export interface TimelineRange {
  start: Date;
  end: Date;
  totalDays: number;
}

export function getTimelineRange(
  legs: Array<{ arrivalDate: string; departureDate: string }>
): TimelineRange | null {
  if (legs.length === 0) return null;

  const arrivals = legs.map((l) => parseDate(l.arrivalDate));
  const departures = legs.map((l) => parseDate(l.departureDate));

  const earliest = new Date(Math.min(...arrivals.map((d) => d.getTime())));
  const latest = new Date(Math.max(...departures.map((d) => d.getTime())));

  // Add 7-day padding on each side
  const start = new Date(earliest);
  start.setUTCDate(start.getUTCDate() - 7);
  const end = new Date(latest);
  end.setUTCDate(end.getUTCDate() + 7);

  const totalDays = daysBetween(start, end);

  return { start, end, totalDays: Math.max(totalDays, 1) };
}

export function getBarPosition(
  arrivalDate: string,
  departureDate: string,
  range: TimelineRange
): { left: string; width: string } {
  const arrival = parseDate(arrivalDate);
  const departure = parseDate(departureDate);

  const leftDays = daysBetween(range.start, arrival);
  const widthDays = daysBetween(arrival, departure) + 1; // inclusive

  const left = `${(leftDays / range.totalDays) * 100}%`;
  const width = `${Math.max((widthDays / range.totalDays) * 100, 1)}%`;

  return { left, width };
}

const STATUS_COLORS: Record<string, string> = {
  compliant: "bg-green-500/80",
  violation: "bg-red-500/80",
  warning: "bg-yellow-500/80",
};

export function getCountryColor(status?: string): string {
  return STATUS_COLORS[status ?? "compliant"] ?? "bg-blue-500/80";
}
