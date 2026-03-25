"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Map, Trash2 } from "lucide-react";
import { deleteItinerary } from "@/actions/itinerary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ItineraryCardProps {
  id: string;
  name: string;
  status: string;
  legCount: number;
  dateRange: { earliest: string | null; latest: string | null };
  compliance: { isCompliant: boolean; issueCount: number };
}

export function ItineraryCard({
  id,
  name,
  status,
  legCount,
  dateRange,
  compliance,
}: ItineraryCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteItinerary({ id });
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription>
              {dateRange.earliest && dateRange.latest
                ? `${dateRange.earliest} → ${dateRange.latest}`
                : "No dates set"}
            </CardDescription>
          </div>
          <Badge
            variant={compliance.isCompliant ? "default" : "destructive"}
          >
            {compliance.isCompliant ? "Compliant" : `${compliance.issueCount} issue${compliance.issueCount !== 1 ? "s" : ""}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{legCount} destination{legCount !== 1 ? "s" : ""}</span>
          <Badge variant="outline">{status}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="default" size="sm" render={<Link href={`/planner/${id}`} />}>
          <Map className="h-4 w-4" />
          Open Planner
        </Button>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" size="sm" disabled={isPending} />}>
            <Trash2 className="h-4 w-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete itinerary?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{name}&rdquo; and all its destinations. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
