"use client";

import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ComplianceData } from "@/actions/compliance";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompliancePanelProps {
  compliance: ComplianceData | null;
}

export function CompliancePanel({ compliance }: CompliancePanelProps) {
  if (!compliance) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Add destinations to see compliance status.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { overall, schengen, perCountry } = compliance;
  const schengenPct = Math.min(100, (schengen.daysUsed / 90) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {overall.isCompliant ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-green-500">All Clear</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-500">Issues Found</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Schengen progress */}
        {schengen.daysUsed > 0 || perCountry.some((c) => c.countryCode === "DE" || c.countryCode === "FR") ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Schengen 90/180</span>
              <span>
                {schengen.daysUsed}/90 days ({schengen.daysRemaining} left)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  schengen.daysRemaining === 0
                    ? "bg-red-500"
                    : schengen.daysRemaining < 7
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${schengenPct}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Per-country breakdown */}
        {perCountry.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium">Per Country</span>
            {perCountry.map((c) => (
              <div
                key={c.countryCode}
                className="flex items-center justify-between text-xs"
              >
                <span>{c.countryName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{c.totalDays}d</span>
                  <Badge
                    variant={
                      c.status === "violation"
                        ? "destructive"
                        : c.status === "warning"
                          ? "outline"
                          : "default"
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {c.status === "violation" && (
                      <AlertCircle className="h-3 w-3 mr-0.5" />
                    )}
                    {c.status === "warning" && (
                      <AlertTriangle className="h-3 w-3 mr-0.5" />
                    )}
                    {c.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Issue messages */}
        {overall.issues.length > 0 && (
          <div className="space-y-1">
            {overall.issues.map((issue, i) => (
              <p key={i} className="text-xs text-red-400">
                {issue}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
