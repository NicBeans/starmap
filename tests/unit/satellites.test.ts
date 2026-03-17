import { describe, it, expect } from "vitest";
import { parseTLEs, getSatellitePosition } from "@/lib/satellites";

const ISS_TLE = `ISS (ZARYA)
1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9993
2 25544  51.6400 200.0000 0007417  50.0000 310.0000 15.49000000400000`;

describe("satellites", () => {
  describe("parseTLEs", () => {
    it("parses 3LE format", () => {
      const tles = parseTLEs(ISS_TLE);
      expect(tles).toHaveLength(1);
      expect(tles[0].name).toBe("ISS (ZARYA)");
      expect(tles[0].line1).toContain("25544U");
      expect(tles[0].line2).toContain("51.6400");
    });

    it("parses multiple TLEs", () => {
      const multi = `${ISS_TLE}\nHUBBLE
1 20580U 90037B   24001.50000000  .00000000  00000-0  00000-0 0  9999
2 20580  28.4700  50.0000 0002711  90.0000 270.0000 15.09000000100000`;
      const tles = parseTLEs(multi);
      expect(tles).toHaveLength(2);
    });

    it("returns empty for invalid input", () => {
      expect(parseTLEs("")).toEqual([]);
      expect(parseTLEs("hello world")).toEqual([]);
    });
  });

  describe("getSatellitePosition", () => {
    it("returns a position for valid TLE", () => {
      const tle = parseTLEs(ISS_TLE)[0];
      const observer = { lat: 40.7128, lng: -74.006 }; // NYC
      // Use a date relatively close to TLE epoch for accuracy
      const date = new Date("2024-01-01T12:00:00Z");
      const pos = getSatellitePosition(tle, observer, date);

      expect(pos).not.toBeNull();
      if (pos) {
        expect(pos.name).toBe("ISS (ZARYA)");
        expect(pos.heightKm).toBeGreaterThan(300);
        expect(pos.heightKm).toBeLessThan(500);
        expect(pos.lat).toBeGreaterThanOrEqual(-90);
        expect(pos.lat).toBeLessThanOrEqual(90);
      }
    });
  });
});
