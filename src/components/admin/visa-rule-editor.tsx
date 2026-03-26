"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVisaRule } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VisaRuleEditorProps {
  rule: {
    id: string;
    countryCode: string;
    passportNationality: string;
    stayLimitDays: number;
    windowDays: number | null;
    visaType: string;
    requiresVisa: boolean;
    notes: string | null;
  };
}

export function VisaRuleEditor({ rule }: VisaRuleEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stayLimit, setStayLimit] = useState(String(rule.stayLimitDays));
  const [windowDays, setWindowDays] = useState(
    rule.windowDays !== null ? String(rule.windowDays) : ""
  );
  const [visaType, setVisaType] = useState(rule.visaType);
  const [editing, setEditing] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateVisaRule({
        ruleId: rule.id,
        updates: {
          stayLimitDays: parseInt(stayLimit, 10),
          windowDays: windowDays ? parseInt(windowDays, 10) : null,
          visaType,
        },
      });
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
        Edit
      </Button>
    );
  }

  return (
    <div className="space-y-2 p-2 border rounded">
      <div className="space-y-1">
        <Label className="text-xs">Stay Limit (days)</Label>
        <Input
          type="number"
          value={stayLimit}
          onChange={(e) => setStayLimit(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Window (days)</Label>
        <Input
          type="number"
          value={windowDays}
          onChange={(e) => setWindowDays(e.target.value)}
          placeholder="null"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Visa Type</Label>
        <Input
          value={visaType}
          onChange={(e) => setVisaType(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
