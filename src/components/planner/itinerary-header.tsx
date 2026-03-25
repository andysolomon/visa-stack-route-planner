"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateItinerary } from "@/actions/itinerary";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ItineraryHeaderProps {
  id: string;
  name: string;
  status: string;
}

export function ItineraryHeader({ id, name, status }: ItineraryHeaderProps) {
  const router = useRouter();
  const [localName, setLocalName] = useState(name);
  const [isPending, startTransition] = useTransition();

  function handleBlur() {
    if (localName === name || localName.trim() === "") return;
    startTransition(async () => {
      await updateItinerary({ id, name: localName.trim() });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={handleBlur}
        disabled={isPending}
        className="text-lg font-semibold border-none shadow-none focus-visible:ring-1 px-1"
      />
      <Badge variant="outline">{status}</Badge>
    </div>
  );
}
