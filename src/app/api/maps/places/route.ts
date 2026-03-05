import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_SERVER_KEY env var not configured" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    // Surface Google API-level errors (e.g. REQUEST_DENIED = API not enabled, INVALID_REQUEST)
    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: `Google Places API error: ${data.status} — ${data.error_message ?? "no details"}` },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to search places" }, { status: 500 });
  }
}
