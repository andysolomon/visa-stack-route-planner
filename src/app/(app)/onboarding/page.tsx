"use client";

import { useState, useTransition } from "react";
import { createProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import countries from "@/lib/data/countries.json";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [homeCountry, setHomeCountry] = useState("");
  const [passportList, setPassportList] = useState<string[]>([""]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addPassport() {
    setPassportList((prev) => [...prev, ""]);
  }

  function removePassport(index: number) {
    if (passportList.length <= 1) return;
    setPassportList((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePassport(index: number, value: string) {
    setPassportList((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function handleSubmit() {
    setError(null);

    const validPassports = passportList.filter((p) => p.length === 2);
    if (!homeCountry) {
      setError("Please select your home country.");
      return;
    }
    if (validPassports.length === 0) {
      setError("Please add at least one passport nationality.");
      return;
    }

    startTransition(async () => {
      try {
        await createProfile({
          homeCountry,
          passports: validPassports.map((nationality) => ({ nationality })),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create profile"
        );
      }
    });
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set Up Your Profile</CardTitle>
          <CardDescription>
            {step === 1
              ? "Where is your home base?"
              : "Which passports do you hold?"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="homeCountry">Home Country</Label>
                <Select value={homeCountry} onValueChange={(val) => val && setHomeCountry(val)}>
                  <SelectTrigger id="homeCountry">
                    <SelectValue placeholder="Select your home country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!homeCountry}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {passportList.map((passport, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>Passport {index + 1}</Label>
                    <Select
                      value={passport}
                      onValueChange={(val) => val && updatePassport(index, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {passportList.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePassport(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addPassport} className="w-full">
                + Add Another Passport
              </Button>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex-1"
                >
                  {isPending ? "Saving..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
