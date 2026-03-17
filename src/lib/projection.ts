import type { AltAz } from "./coordinates";

export interface Point2D {
  x: number;
  y: number;
}

const DEG2RAD = Math.PI / 180;

/**
 * Stereographic projection: maps the hemisphere onto a flat disc.
 * Center of the disc is the zenith, edge is the horizon.
 * Returns normalized coordinates (-1 to 1 range).
 */
export function stereographic(altAz: AltAz): Point2D {
  const alt = altAz.altitude * DEG2RAD;
  const az = altAz.azimuth * DEG2RAD;

  // Distance from center (0 = zenith, 1 = horizon)
  const r = Math.cos(alt) / (1 + Math.sin(alt));

  return {
    x: r * Math.sin(az),
    y: -r * Math.cos(az), // negative so north is up
  };
}

/**
 * Azimuthal equidistant projection: equal angular distances from center.
 * More traditional planisphere look.
 */
export function azimuthalEquidistant(altAz: AltAz): Point2D {
  const alt = altAz.altitude * DEG2RAD;
  const az = altAz.azimuth * DEG2RAD;

  // Distance from center proportional to zenith angle
  const r = (Math.PI / 2 - alt) / (Math.PI / 2);

  return {
    x: r * Math.sin(az),
    y: -r * Math.cos(az),
  };
}

/**
 * Convert a normalized point (-1 to 1) to canvas pixel coordinates.
 */
export function toCanvasCoords(
  point: Point2D,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 20
): Point2D {
  const size = Math.min(canvasWidth, canvasHeight) - padding * 2;
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  return {
    x: cx + point.x * (size / 2),
    y: cy + point.y * (size / 2),
  };
}

/**
 * Check if a point is within the visible disc (above horizon).
 */
export function isAboveHorizon(altAz: AltAz): boolean {
  return altAz.altitude > 0;
}
