import { describe, it, expect } from "vitest";
import {
  degToRad,
  radToDeg,
  gmst,
  localSiderealTime,
  raDecToAltAz,
  altAzToCartesian,
  raDecToCartesian,
} from "@/lib/coordinates";

describe("coordinates", () => {
  describe("degToRad / radToDeg", () => {
    it("converts degrees to radians", () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
      expect(degToRad(0)).toBe(0);
    });

    it("converts radians to degrees", () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
    });

    it("roundtrips", () => {
      expect(radToDeg(degToRad(45))).toBeCloseTo(45);
      expect(degToRad(radToDeg(1))).toBeCloseTo(1);
    });
  });

  describe("gmst", () => {
    it("computes GMST for J2000 epoch", () => {
      const j2000 = new Date("2000-01-01T12:00:00Z");
      const g = gmst(j2000);
      // GMST at J2000 should be ~18.697 hours
      expect(g).toBeCloseTo(18.697, 0);
    });
  });

  describe("localSiderealTime", () => {
    it("equals GMST at Greenwich (longitude 0)", () => {
      const date = new Date("2024-03-20T12:00:00Z");
      const g = gmst(date);
      const lst = localSiderealTime(date, 0);
      expect(lst).toBeCloseTo(g, 5);
    });

    it("shifts by longitude", () => {
      const date = new Date("2024-03-20T12:00:00Z");
      const lst0 = localSiderealTime(date, 0);
      const lst90 = localSiderealTime(date, 90);
      const diff = ((lst90 - lst0) % 24 + 24) % 24;
      expect(diff).toBeCloseTo(6, 0); // 90° = 6 hours
    });
  });

  describe("raDecToAltAz", () => {
    it("puts the zenith object at altitude ~90°", () => {
      const date = new Date("2024-06-21T00:00:00Z");
      const observer = { lat: 0, lng: 0 };
      const lst = localSiderealTime(date, 0);

      // Object at the zenith: RA = LST, Dec = latitude
      const result = raDecToAltAz(
        { ra: lst, dec: observer.lat },
        observer,
        date
      );
      expect(result.altitude).toBeCloseTo(90, 0);
    });

    it("puts objects below horizon at negative altitude", () => {
      const date = new Date("2024-06-21T12:00:00Z");
      const observer = { lat: 45, lng: 0 };
      // Object at south celestial pole should be below horizon at 45°N
      const result = raDecToAltAz({ ra: 0, dec: -89 }, observer, date);
      expect(result.altitude).toBeLessThan(0);
    });
  });

  describe("altAzToCartesian", () => {
    it("puts zenith along Y axis", () => {
      const pos = altAzToCartesian({ altitude: 90, azimuth: 0 }, 1);
      expect(pos.y).toBeCloseTo(1);
      expect(Math.abs(pos.x)).toBeLessThan(0.01);
      expect(Math.abs(pos.z)).toBeLessThan(0.01);
    });

    it("puts horizon objects at Y=0", () => {
      const pos = altAzToCartesian({ altitude: 0, azimuth: 90 }, 1);
      expect(pos.y).toBeCloseTo(0, 1);
    });
  });

  describe("raDecToCartesian", () => {
    it("returns unit vector for unit radius", () => {
      const pos = raDecToCartesian({ ra: 6, dec: 45 }, 1);
      const len = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
      expect(len).toBeCloseTo(1);
    });

    it("puts north pole at Y=1", () => {
      const pos = raDecToCartesian({ ra: 0, dec: 90 }, 1);
      expect(pos.y).toBeCloseTo(1);
    });
  });
});
