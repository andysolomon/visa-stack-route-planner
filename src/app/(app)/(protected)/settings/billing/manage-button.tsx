"use client";

import { useTransition } from "react";
import { createPortalSession } from "@/actions/subscription";
import { Button } from "@/components/ui/button";

export function ManageButton() {
  const [isPending, startTransition] = useTransition();

  function handleManage() {
    startTransition(async () => {
      const { url } = await createPortalSession();
      window.location.href = url;
    });
  }

  return (
    <Button onClick={handleManage} disabled={isPending} variant="outline">
      {isPending ? "Loading..." : "Manage Subscription"}
    </Button>
  );
}
