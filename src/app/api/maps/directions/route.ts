import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const waypoints = searchParams.get("waypoints") ?? "";

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination are required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_SERVER_KEY env var not configured" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  if (waypoints) url.searchParams.set("waypoints", waypoints);
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch directions" }, { status: 500 });
  }
}
