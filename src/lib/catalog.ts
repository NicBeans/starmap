export interface StarData {
  id: number;
  hip: number | null; // Hipparcos catalog number
  name: string | null; // common name
  ra: number; // right ascension in hours
  dec: number; // declination in degrees
  mag: number; // apparent visual magnitude
  spectralType: string;
  constellation: string;
  distance: number; // parsecs, -1 if unknown
  bayer: string | null; // Bayer designation
}

export interface DSOData {
  id: string; // e.g. "M31", "NGC1234"
  name: string | null; // common name
  type: "galaxy" | "nebula" | "cluster" | "planetary_nebula" | "other";
  ra: number;
  dec: number;
  mag: number;
  constellation: string;
  sizeArcmin: number;
}

export interface ConstellationLine {
  constellation: string;
  name: string;
  segments: [number, number][]; // pairs of star HIP IDs
}

let starCatalog: StarData[] = [];
let dsoCatalog: DSOData[] = [];
let constellationLines: ConstellationLine[] = [];
let loaded = false;

/**
 * Load star catalog from JSON data file.
 */
export async function loadCatalogs(): Promise<void> {
  if (loaded) return;

  const [starsRes, dsoRes, constRes] = await Promise.all([
    fetch("/data/stars.json"),
    fetch("/data/dso.json"),
    fetch("/data/constellations.json"),
  ]);

  starCatalog = await starsRes.json();
  dsoCatalog = await dsoRes.json();
  constellationLines = await constRes.json();
  loaded = true;
}

export function getStars(): StarData[] {
  return starCatalog;
}

export function getDSOs(): DSOData[] {
  return dsoCatalog;
}

export function getConstellationLines(): ConstellationLine[] {
  return constellationLines;
}

/**
 * Get stars filtered by maximum magnitude (brightness threshold).
 */
export function getStarsByMagnitude(maxMag: number): StarData[] {
  return starCatalog.filter((s) => s.mag <= maxMag);
}

/**
 * Find a star by HIP number.
 */
export function getStarByHip(hip: number): StarData | undefined {
  return starCatalog.find((s) => s.hip === hip);
}

/**
 * Search stars and DSOs by name (case-insensitive partial match).
 */
export function searchObjects(
  query: string,
  limit: number = 20
): (StarData | DSOData)[] {
  const q = query.toLowerCase();
  const results: (StarData | DSOData)[] = [];

  for (const star of starCatalog) {
    if (results.length >= limit) break;
    if (
      (star.name && star.name.toLowerCase().includes(q)) ||
      (star.bayer && star.bayer.toLowerCase().includes(q))
    ) {
      results.push(star);
    }
  }

  for (const dso of dsoCatalog) {
    if (results.length >= limit) break;
    if (
      dso.id.toLowerCase().includes(q) ||
      (dso.name && dso.name.toLowerCase().includes(q))
    ) {
      results.push(dso);
    }
  }

  return results;
}

export function isLoaded(): boolean {
  return loaded;
}
