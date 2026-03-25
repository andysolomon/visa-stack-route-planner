"use client";

import { useTransition } from "react";
import { CreditCard } from "lucide-react";
import { createCheckoutSession } from "@/actions/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UpgradePromptProps {
  message?: string;
}

export function UpgradePrompt({
  message = "Unlock unlimited destinations for $15/mo",
}: UpgradePromptProps) {
  const [isPending, startTransition] = useTransition();

  function handleUpgrade() {
    startTransition(async () => {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    });
  }

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardContent className="flex items-center gap-3 p-3">
        <CreditCard className="h-5 w-5 text-yellow-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <Button
          onClick={handleUpgrade}
          disabled={isPending}
          size="sm"
          variant="default"
        >
          {isPending ? "Loading..." : "Upgrade"}
        </Button>
      </CardContent>
    </Card>
  );
}
