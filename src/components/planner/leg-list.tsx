"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { updateLeg, removeLeg, reorderLegs } from "@/actions/itinerary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Leg {
  id: string;
  itineraryId: string;
  countryCode: string;
  city: string | null;
  arrivalDate: string;
  departureDate: string;
  sortOrder: number;
}

interface LegListProps {
  itineraryId: string;
  legs: Leg[];
  countries: Array<{ code: string; name: string }>;
}

export function LegList({ itineraryId, legs, countries }: LegListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const countryMap = new Map(countries.map((c) => [c.code, c.name]));

  function handleDateChange(legId: string, field: "arrivalDate" | "departureDate", value: string) {
    startTransition(async () => {
      await updateLeg({ id: legId, [field]: value });
      router.refresh();
    });
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const newIds = legs.map((l) => l.id);
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    startTransition(async () => {
      await reorderLegs({ itineraryId, legIds: newIds });
      router.refresh();
    });
  }

  function handleMoveDown(index: number) {
    if (index === legs.length - 1) return;
    const newIds = legs.map((l) => l.id);
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    startTransition(async () => {
      await reorderLegs({ itineraryId, legIds: newIds });
      router.refresh();
    });
  }

  function handleDelete(legId: string) {
    startTransition(async () => {
      await removeLeg({ id: legId });
      router.refresh();
    });
  }

  if (legs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No destinations yet. Add one above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {legs.map((leg, index) => (
        <Card key={leg.id} className="relative">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="font-medium text-sm">
                  {countryMap.get(leg.countryCode) ?? leg.countryCode}
                </span>
                {leg.city && (
                  <span className="text-xs text-muted-foreground">
                    {leg.city}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || isPending}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === legs.length - 1 || isPending}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDelete(leg.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={leg.arrivalDate}
                onChange={(e) =>
                  handleDateChange(leg.id, "arrivalDate", e.target.value)
                }
                disabled={isPending}
                className="flex-1 rounded-md border bg-transparent px-2 py-1 text-xs"
              />
              <span className="text-muted-foreground text-xs self-center">→</span>
              <input
                type="date"
                value={leg.departureDate}
                onChange={(e) =>
                  handleDateChange(leg.id, "departureDate", e.target.value)
                }
                disabled={isPending}
                className="flex-1 rounded-md border bg-transparent px-2 py-1 text-xs"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
