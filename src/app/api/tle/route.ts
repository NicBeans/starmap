import { NextResponse } from "next/server";

const CELESTRAK_BASE =
  process.env.CELESTRAK_URL || "https://celestrak.org";
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

interface CacheEntry {
  data: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const GROUPS: Record<string, string> = {
  visual: "/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle",
  stations: "/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
  starlink: "/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle",
  "active": "/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group") || "visual";

  const path = GROUPS[group];
  if (!path) {
    return NextResponse.json(
      { error: `Unknown group: ${group}` },
      { status: 400 }
    );
  }

  // Check cache
  const cached = cache.get(group);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new NextResponse(cached.data, {
      headers: {
        "Content-Type": "text/plain",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const url = `${CELESTRAK_BASE}${path}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "StarMap/1.0" },
    });

    if (!response.ok) {
      throw new Error(`CelesTrak returned ${response.status}`);
    }

    const data = await response.text();

    // Update cache
    cache.set(group, { data, timestamp: Date.now() });

    return new NextResponse(data, {
      headers: {
        "Content-Type": "text/plain",
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=14400",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch TLE data: ${message}` },
      { status: 502 }
    );
  }
}
