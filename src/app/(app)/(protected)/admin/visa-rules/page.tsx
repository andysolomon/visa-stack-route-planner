import { getVisaRules } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisaRuleEditor } from "@/components/admin/visa-rule-editor";

export default async function AdminVisaRulesPage() {
  const rules = await getVisaRules();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Visa Rules Admin</h1>
      <p className="text-sm text-muted-foreground">
        {rules.length} rules across {new Set(rules.map((r) => r.countryCode)).size} countries.
        Changes are logged and affected users are notified.
      </p>

      <div className="space-y-2">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="font-mono">
                  {rule.countryCode}
                </Badge>
                <span className="text-sm">
                  {rule.passportNationality} passport
                </span>
                <span className="text-sm text-muted-foreground">
                  {rule.stayLimitDays === -1
                    ? "Unlimited"
                    : `${rule.stayLimitDays}d`}
                  {rule.windowDays ? ` / ${rule.windowDays}d window` : ""}
                </span>
                <Badge variant={rule.requiresVisa ? "destructive" : "default"}>
                  {rule.visaType}
                </Badge>
              </div>
              <VisaRuleEditor rule={rule} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
