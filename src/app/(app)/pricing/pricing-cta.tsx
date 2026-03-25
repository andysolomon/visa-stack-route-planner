"use client";

import { useTransition } from "react";
import { createCheckoutSession } from "@/actions/subscription";
import { Button } from "@/components/ui/button";

export function PricingCTA() {
  const [isPending, startTransition] = useTransition();

  function handleUpgrade() {
    startTransition(async () => {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    });
  }

  return (
    <Button onClick={handleUpgrade} disabled={isPending} className="w-full">
      {isPending ? "Loading..." : "Upgrade to Pro"}
    </Button>
  );
}
