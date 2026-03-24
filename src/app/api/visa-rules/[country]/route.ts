import { type NextRequest } from "next/server";
import { getVisaRule } from "@/lib/visa/lookup";

const isAlpha2 = (s: string) => /^[A-Za-z]{2}$/.test(s);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country } = await params;

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
