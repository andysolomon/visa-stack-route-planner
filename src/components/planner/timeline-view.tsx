"use client";

import { useMemo, useState } from "react";
import type { ComplianceData, PerCountryStatus } from "@/actions/compliance";
import {
  getTimelineRange,
  getBarPosition,
  getCountryColor,
} from "@/lib/timeline/utils";
import countries from "@/lib/data/countries.json";

const countryMap = new Map(countries.map((c) => [c.code, c.name]));

interface Leg {
  id: string;
  countryCode: string;
  arrivalDate: string;
  departureDate: string;
  city?: string | null;
}

interface TimelineViewProps {
  legs: Leg[];
  compliance: ComplianceData | null;
}

export function TimelineView({ legs, compliance }: TimelineViewProps) {
  const [hoveredLeg, setHoveredLeg] = useState<string | null>(null);

  const range = useMemo(() => getTimelineRange(legs), [legs]);

  const statusMap = useMemo(() => {
    const m = new Map<string, PerCountryStatus["status"]>();
    if (compliance?.perCountry) {
      for (const c of compliance.perCountry) {
        m.set(c.countryCode, c.status);
      }
    }
    return m;
  }, [compliance]);

  // Group legs by country for stacked rows
  const countryRows = useMemo(() => {
    const rows = new Map<string, Leg[]>();
    for (const leg of legs) {
      const code = leg.countryCode;
      if (!rows.has(code)) rows.set(code, []);
      rows.get(code)!.push(leg);
    }
    return rows;
  }, [legs]);

  if (!range || legs.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Add destinations to see timeline.
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-x-auto">
      {Array.from(countryRows.entries()).map(([countryCode, countryLegs]) => (
        <div key={countryCode} className="flex items-center gap-2">
          <span className="w-8 text-xs text-muted-foreground shrink-0 text-right">
            {countryCode}
          </span>
          <div className="relative h-6 flex-1 rounded bg-muted/30">
            {countryLegs.map((leg) => {
              const pos = getBarPosition(
                leg.arrivalDate,
                leg.departureDate,
                range
              );
              const status = statusMap.get(countryCode);
              const isHovered = hoveredLeg === leg.id;

              return (
                <div
                  key={leg.id}
                  className={`absolute top-0 h-full rounded ${getCountryColor(status)} cursor-pointer transition-opacity ${
                    isHovered ? "opacity-100 ring-1 ring-white/50" : "opacity-80"
                  }`}
                  style={{ left: pos.left, width: pos.width }}
                  onMouseEnter={() => setHoveredLeg(leg.id)}
                  onMouseLeave={() => setHoveredLeg(null)}
                >
                  {isHovered && (
                    <div className="absolute bottom-full mb-1 left-0 z-10 rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md whitespace-nowrap">
                      <span className="font-medium">
                        {countryMap.get(countryCode) ?? countryCode}
                      </span>
                      {leg.city && (
                        <span className="text-muted-foreground"> ({leg.city})</span>
                      )}
                      <br />
                      {leg.arrivalDate} → {leg.departureDate}
                      {compliance?.perCountry && (
                        <>
                          <br />
                          {compliance.perCountry.find(
                            (c) => c.countryCode === countryCode
                          )?.totalDays ?? 0}{" "}
                          days total
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
