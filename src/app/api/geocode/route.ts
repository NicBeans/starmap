import { NextResponse } from "next/server";

const GEOCODE_BASE =
  process.env.GEOCODE_URL || "https://nominatim.openstreetmap.org";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  try {
    const url = `${GEOCODE_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "StarMap/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding returned ${response.status}`);
    }

    const results = await response.json();

    const locations = results.map(
      (r: { display_name: string; lat: string; lon: string }) => ({
        name: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      })
    );

    return NextResponse.json(locations, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Geocoding failed: ${message}` },
      { status: 502 }
    );
  }
}
