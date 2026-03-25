"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { getAISuggestions } from "@/actions/ai-suggestions";
import { replaceAllLegs } from "@/actions/itinerary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RouteSuggestions } from "@/lib/ai/route-suggestions";
import countries from "@/lib/data/countries.json";

const countryMap = new Map(countries.map((c) => [c.code, c.name]));

interface AISuggestionsPanelProps {
  itineraryId: string;
  isCompliant: boolean;
}

export function AISuggestionsPanel({
  itineraryId,
  isCompliant,
}: AISuggestionsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<RouteSuggestions | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isCompliant) return null;

  function handleGetSuggestions() {
    setError(null);
    setSuggestions(null);
    startTransition(async () => {
      try {
        const result = await getAISuggestions(itineraryId);
        setSuggestions(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get suggestions"
        );
      }
    });
  }

  function handleApply(legs: RouteSuggestions["suggestions"][0]["legs"]) {
    startTransition(async () => {
      try {
        await replaceAllLegs({ itineraryId, legs });
        setSuggestions(null);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to apply suggestion"
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-purple-400" />
          AI Route Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!suggestions && (
          <Button
            onClick={handleGetSuggestions}
            disabled={isPending}
            variant="outline"
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Get AI Suggestions
              </>
            )}
          </Button>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {suggestions?.suggestions.map((suggestion, i) => (
          <Card key={i} className="border-purple-500/20">
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium">{suggestion.description}</p>
              <p className="text-xs text-muted-foreground">
                {suggestion.reasoning}
              </p>
              <div className="flex flex-wrap gap-1">
                {suggestion.legs.map((leg, j) => (
                  <span
                    key={j}
                    className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px]"
                  >
                    {countryMap.get(leg.countryCode) ?? leg.countryCode}
                  </span>
                ))}
              </div>
              <Button
                onClick={() => handleApply(suggestion.legs)}
                disabled={isPending}
                size="sm"
                className="w-full"
              >
                Apply This Route
              </Button>
            </CardContent>
          </Card>
        ))}

        {suggestions && suggestions.suggestions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            No alternative routes found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
