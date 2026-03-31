import Image from "next/image";
import Link from "next/link";
import { Map, Shield, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Map,
    title: "Map-Based Route Planning",
    description:
      "Build itineraries visually on an interactive dark-mode map. Add destinations, reorder legs, and see your route at a glance.",
  },
  {
    icon: Shield,
    title: "Visa Compliance Checking",
    description:
      "Real-time Schengen 90/180 day tracking and per-country stay limit validation across 36 supported countries.",
  },
  {
    icon: Sparkles,
    title: "AI Route Suggestions",
    description:
      "When your route violates visa rules, AI suggests compliant alternatives — reorder or swap destinations automatically.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center">
        <Image src="/logo.svg" alt="Visa Stack" width={64} height={64} className="mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
          Plan visa-compliant travel routes
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl">
          The route planner built for digital nomads. Navigate visa rules across
          36 countries with confidence.
        </p>
        <div className="flex gap-3 mt-8">
          <Button size="lg" render={<Link href="/sign-up" />}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/pricing" />}>
            See Pricing
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Everything you need to travel legally
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <f.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {f.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="px-6 py-16 md:py-24 border-t">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">$0</span>/month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> 2 destinations per itinerary
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> Compliance checking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> Map view
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">$15</span>/month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> Unlimited destinations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> AI route suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> Compliance timeline
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <Button size="lg" className="mt-8" render={<Link href="/pricing" />}>
            View Full Pricing
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        Visa Stack Route Planner — Built for digital nomads
      </footer>
    </div>
  );
}
