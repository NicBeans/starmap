import * as Astronomy from "astronomy-engine";
import type { LatLng, AltAz, RADec } from "./coordinates";

export interface CelestialBody {
  id: string;
  name: string;
  type: "planet" | "moon" | "sun";
  ra: number;
  dec: number;
  altitude: number;
  azimuth: number;
  magnitude: number;
  distance: number; // AU
  illumination?: number; // fraction for moon
}

const BODIES = [
  { body: Astronomy.Body.Sun, name: "Sun", type: "sun" as const },
  { body: Astronomy.Body.Moon, name: "Moon", type: "moon" as const },
  { body: Astronomy.Body.Mercury, name: "Mercury", type: "planet" as const },
  { body: Astronomy.Body.Venus, name: "Venus", type: "planet" as const },
  { body: Astronomy.Body.Mars, name: "Mars", type: "planet" as const },
  { body: Astronomy.Body.Jupiter, name: "Jupiter", type: "planet" as const },
  { body: Astronomy.Body.Saturn, name: "Saturn", type: "planet" as const },
  { body: Astronomy.Body.Uranus, name: "Uranus", type: "planet" as const },
  { body: Astronomy.Body.Neptune, name: "Neptune", type: "planet" as const },
] as const;

function makeObserver(location: LatLng): Astronomy.Observer {
  return new Astronomy.Observer(location.lat, location.lng, 0);
}

export function getCelestialBodies(
  location: LatLng,
  date: Date
): CelestialBody[] {
  const observer = makeObserver(location);

  return BODIES.map(({ body, name, type }) => {
    const equ = Astronomy.Equator(body, date, observer, true, true);
    const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");

    let magnitude = 0;
    try {
      if (body !== Astronomy.Body.Sun && body !== Astronomy.Body.Moon) {
        const illum = Astronomy.Illumination(body, date);
        magnitude = illum.mag;
      } else if (body === Astronomy.Body.Sun) {
        magnitude = -26.74;
      } else {
        magnitude = -12.7; // approximate full moon
      }
    } catch {
      magnitude = 0;
    }

    const result: CelestialBody = {
      id: `body_${name.toLowerCase()}`,
      name,
      type,
      ra: equ.ra,
      dec: equ.dec,
      altitude: hor.altitude,
      azimuth: hor.azimuth,
      magnitude,
      distance: equ.dist,
    };

    if (body === Astronomy.Body.Moon) {
      try {
        const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, date);
        result.illumination = moonIllum.phase_fraction;
      } catch {
        result.illumination = 0.5;
      }
    }

    return result;
  });
}

export function getBodyPosition(
  bodyName: string,
  location: LatLng,
  date: Date
): { raDec: RADec; altAz: AltAz } | null {
  const entry = BODIES.find(
    (b) => b.name.toLowerCase() === bodyName.toLowerCase()
  );
  if (!entry) return null;

  const observer = makeObserver(location);
  const equ = Astronomy.Equator(entry.body, date, observer, true, true);
  const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");

  return {
    raDec: { ra: equ.ra, dec: equ.dec },
    altAz: { altitude: hor.altitude, azimuth: hor.azimuth },
  };
}

export function getSunAltitude(location: LatLng, date: Date): number {
  const observer = makeObserver(location);
  const equ = Astronomy.Equator(
    Astronomy.Body.Sun,
    date,
    observer,
    true,
    true
  );
  const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");
  return hor.altitude;
}
