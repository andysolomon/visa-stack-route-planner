"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  updateHomeCountry,
  addPassport,
  removePassport,
} from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import countries from "@/lib/data/countries.json";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [homeCountry, setHomeCountry] = useState("");
  const [passportList, setPassportList] = useState<
    Array<{ id: string; nationality: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  // Load profile data on mount via a server action would be ideal,
  // but for simplicity we'll use the page as a client component
  // and fetch data via an inline server action pattern.
  // For now, show the form and let users edit.

  function handleHomeCountryChange(code: string | null) {
    if (!code) return;
    setHomeCountry(code);
    startTransition(async () => {
      await updateHomeCountry(code);
      router.refresh();
    });
  }

  function handleAddPassport(code: string | null) {
    if (!code) return;
    setError(null);
    startTransition(async () => {
      try {
        await addPassport(code);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add passport");
      }
    });
  }

  function handleRemovePassport(passportId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await removePassport(passportId);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to remove passport"
        );
      }
    });
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Home Country</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={homeCountry}
            onValueChange={handleHomeCountryChange}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select home country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Passports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add or remove passport nationalities. At least one is required.
          </p>

          <Select
            onValueChange={handleAddPassport}
            disabled={isPending}
            value=""
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isPending ? "Adding..." : "Add passport nationality..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
