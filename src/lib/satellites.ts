import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  eciToEcf,
  ecfToLookAngles,
  degreesLong,
  degreesLat,
} from "satellite.js";
import type { LatLng, AltAz } from "./coordinates";

export interface TLEData {
  name: string;
  line1: string;
  line2: string;
}

export interface SatellitePosition {
  id: string;
  name: string;
  altitude: number; // degrees above horizon
  azimuth: number; // degrees from north
  range: number; // km
  lat: number;
  lng: number;
  heightKm: number;
  visible: boolean;
}

export interface SatellitePass {
  satelliteName: string;
  startTime: Date;
  peakTime: Date;
  endTime: Date;
  peakAltitude: number; // degrees
  peakAzimuth: number;
  brightness: number; // approx visual magnitude
}

/**
 * Parse 3LE format (name + two TLE lines) into TLEData array.
 */
export function parseTLEs(raw: string): TLEData[] {
  const lines = raw.trim().split("\n");
  const tles: TLEData[] = [];

  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i].trim();
    const line1 = lines[i + 1].trim();
    const line2 = lines[i + 2].trim();
    if (line1.startsWith("1 ") && line2.startsWith("2 ")) {
      tles.push({ name, line1, line2 });
    }
  }

  return tles;
}

/**
 * Compute current position of a satellite as seen from an observer.
 */
export function getSatellitePosition(
  tle: TLEData,
  observer: LatLng,
  date: Date
): SatellitePosition | null {
  try {
    const satrec = twoline2satrec(tle.line1, tle.line2);
    const positionAndVelocity = propagate(satrec, date);

    if (
      !positionAndVelocity ||
      typeof positionAndVelocity.position === "boolean" ||
      !positionAndVelocity.position
    ) {
      return null;
    }

    const gmstVal = gstime(date);
    const positionEci = positionAndVelocity.position;
    const positionGd = eciToGeodetic(positionEci, gmstVal);
    const positionEcf = eciToEcf(positionEci, gmstVal);

    const observerGd = {
      longitude: (observer.lng * Math.PI) / 180,
      latitude: (observer.lat * Math.PI) / 180,
      height: 0,
    };

    const lookAngles = ecfToLookAngles(observerGd, positionEcf);

    const altitudeDeg = (lookAngles.elevation * 180) / Math.PI;
    const azimuthDeg = (lookAngles.azimuth * 180) / Math.PI;

    return {
      id: `sat_${tle.name.replace(/\s+/g, "_").toLowerCase()}`,
      name: tle.name,
      altitude: altitudeDeg,
      azimuth: azimuthDeg,
      range: lookAngles.rangeSat,
      lat: degreesLat(positionGd.latitude),
      lng: degreesLong(positionGd.longitude),
      heightKm: positionGd.height,
      visible: altitudeDeg > 0,
    };
  } catch {
    return null;
  }
}

/**
 * Predict visible passes for a satellite over the next N hours.
 */
export function predictPasses(
  tle: TLEData,
  observer: LatLng,
  hoursAhead: number = 24,
  minAltitude: number = 10
): SatellitePass[] {
  const passes: SatellitePass[] = [];
  const now = new Date();
  const end = new Date(now.getTime() + hoursAhead * 3600000);
  const stepMs = 30000; // 30 second steps

  let inPass = false;
  let passStart: Date | null = null;
  let peakAlt = 0;
  let peakAz = 0;
  let peakTime: Date | null = null;

  for (
    let t = now.getTime();
    t <= end.getTime();
    t += stepMs
  ) {
    const date = new Date(t);
    const pos = getSatellitePosition(tle, observer, date);

    if (pos && pos.altitude > minAltitude) {
      if (!inPass) {
        inPass = true;
        passStart = date;
        peakAlt = pos.altitude;
        peakAz = pos.azimuth;
        peakTime = date;
      }
      if (pos.altitude > peakAlt) {
        peakAlt = pos.altitude;
        peakAz = pos.azimuth;
        peakTime = date;
      }
    } else if (inPass && passStart && peakTime) {
      passes.push({
        satelliteName: tle.name,
        startTime: passStart,
        peakTime,
        endTime: date,
        peakAltitude: peakAlt,
        peakAzimuth: peakAz,
        brightness: estimateBrightness(peakAlt, tle.name),
      });
      inPass = false;
      passStart = null;
    }
  }

  return passes;
}

function estimateBrightness(peakAlt: number, name: string): number {
  // Rough estimates
  if (name.includes("ISS")) return -3.5;
  if (name.includes("STARLINK")) return 3.0 + (90 - peakAlt) * 0.05;
  return 4.0 + (90 - peakAlt) * 0.05;
}
