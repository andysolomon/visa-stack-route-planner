import { currentUser } from "@clerk/nextjs/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "traveler";

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {firstName}</CardTitle>
          <CardDescription>
            Plan visa-compliant travel routes across 36 countries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Get started by adding your passport details in the onboarding flow,
            then build your first itinerary in the route planner.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
