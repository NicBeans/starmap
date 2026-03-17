export interface LatLng {
  lat: number;
  lng: number;
}

export interface AltAz {
  altitude: number; // degrees above horizon
  azimuth: number; // degrees from north, clockwise
}

export interface RADec {
  ra: number; // right ascension in hours (0-24)
  dec: number; // declination in degrees (-90 to +90)
}

export interface CartesianPoint {
  x: number;
  y: number;
  z: number;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const HOURS2RAD = Math.PI / 12;

export function degToRad(deg: number): number {
  return deg * DEG2RAD;
}

export function radToDeg(rad: number): number {
  return rad * RAD2DEG;
}

export function hoursToRad(hours: number): number {
  return hours * HOURS2RAD;
}

/**
 * Compute Greenwich Mean Sidereal Time in hours for a given Date.
 */
export function gmst(date: Date): number {
  const jd =
    date.getTime() / 86400000 + 2440587.5;
  const t = (jd - 2451545.0) / 36525.0;
  let gmstHours =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000.0;
  gmstHours = ((gmstHours % 360) + 360) % 360;
  return gmstHours / 15.0;
}

/**
 * Compute Local Sidereal Time in hours.
 */
export function localSiderealTime(date: Date, lngDeg: number): number {
  const g = gmst(date);
  return ((g + lngDeg / 15.0) % 24 + 24) % 24;
}

/**
 * Convert RA/Dec to Alt/Az for a given observer location and time.
 */
export function raDecToAltAz(
  raDec: RADec,
  observer: LatLng,
  date: Date
): AltAz {
  const lst = localSiderealTime(date, observer.lng);
  const ha = ((lst - raDec.ra) * 15) * DEG2RAD;
  const dec = raDec.dec * DEG2RAD;
  const lat = observer.lat * DEG2RAD;

  const sinAlt =
    Math.sin(dec) * Math.sin(lat) +
    Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const altitude = Math.asin(sinAlt);

  const cosAz =
    (Math.sin(dec) - Math.sin(altitude) * Math.sin(lat)) /
    (Math.cos(altitude) * Math.cos(lat));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));

  if (Math.sin(ha) > 0) {
    azimuth = 2 * Math.PI - azimuth;
  }

  return {
    altitude: altitude * RAD2DEG,
    azimuth: azimuth * RAD2DEG,
  };
}

/**
 * Convert Alt/Az to a unit vector in a 3D scene.
 * Convention: Y is up, X is east, Z is south (looking north by default).
 */
export function altAzToCartesian(altAz: AltAz, radius: number = 1): CartesianPoint {
  const alt = altAz.altitude * DEG2RAD;
  const az = altAz.azimuth * DEG2RAD;

  return {
    x: -radius * Math.cos(alt) * Math.sin(az),
    y: radius * Math.sin(alt),
    z: -radius * Math.cos(alt) * Math.cos(az),
  };
}

/**
 * Convert RA/Dec directly to a point on a unit celestial sphere.
 */
export function raDecToCartesian(raDec: RADec, radius: number = 1): CartesianPoint {
  const ra = raDec.ra * HOURS2RAD;
  const dec = raDec.dec * DEG2RAD;

  return {
    x: radius * Math.cos(dec) * Math.cos(ra),
    y: radius * Math.sin(dec),
    z: -radius * Math.cos(dec) * Math.sin(ra),
  };
}
