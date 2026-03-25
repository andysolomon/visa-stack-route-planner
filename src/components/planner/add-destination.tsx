"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addLeg } from "@/actions/itinerary";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import countryCoords from "@/lib/data/country-coords.json";

const coords = countryCoords as unknown as Record<string, [number, number]>;

interface AddDestinationProps {
  itineraryId: string;
  countries: Array<{ code: string; name: string }>;
}

export function AddDestination({ itineraryId, countries }: AddDestinationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);

  function handleSelect(code: string | null) {
    if (!code) return;

    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86_400_000)
      .toISOString()
      .split("T")[0];

    const c = coords[code];

    startTransition(async () => {
      try {
        await addLeg({
          itineraryId,
          countryCode: code,
          arrivalDate: today,
          departureDate: nextWeek,
          lat: c ? c[1] : undefined,
          lng: c ? c[0] : undefined,
        });
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Upgrade")) {
          setUpgradeNeeded(true);
        } else {
          console.error(err);
        }
      }
    });
  }

  return (
    <div className="space-y-2">
      <Select onValueChange={(val) => { setUpgradeNeeded(false); handleSelect(val); }} disabled={isPending} value="">
        <SelectTrigger>
          <SelectValue placeholder={isPending ? "Adding..." : "Add destination..."} />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {upgradeNeeded && <UpgradePrompt />}
    </div>
  );
}
