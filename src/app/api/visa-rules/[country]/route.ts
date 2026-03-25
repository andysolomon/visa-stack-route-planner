import { type NextRequest } from "next/server";
import { getVisaRule } from "@/lib/visa/lookup";
import { rateLimit } from "@/lib/rate-limit";

const isAlpha2 = (s: string) => /^[A-Za-z]{2}$/.test(s);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country } = await params;

  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(ip);
  if (!limit.success) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  if (!isAlpha2(country)) {
    return Response.json(
      { error: "Invalid country code. Must be 2-letter ISO 3166-1 alpha-2." },
      { status: 400 }
    );
  }

  const nationality = request.nextUrl.searchParams.get("nationality");

  if (!nationality || !isAlpha2(nationality)) {
    return Response.json(
      {
        error:
          "Missing or invalid nationality query parameter. Must be 2-letter ISO 3166-1 alpha-2.",
      },
      { status: 400 }
    );
  }

  const rule = await getVisaRule(country, nationality);

  if (!rule) {
    return Response.json(
      { error: `No visa rule found for ${country.toUpperCase()}/${nationality.toUpperCase()}` },
      { status: 404 }
    );
  }

  return Response.json({ rule });
}
