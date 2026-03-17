import { describe, it, expect } from "vitest";
import {
  stereographic,
  azimuthalEquidistant,
  toCanvasCoords,
  isAboveHorizon,
} from "@/lib/projection";

describe("projection", () => {
  describe("stereographic", () => {
    it("maps zenith to center", () => {
      const p = stereographic({ altitude: 90, azimuth: 0 });
      expect(p.x).toBeCloseTo(0, 1);
      expect(p.y).toBeCloseTo(0, 1);
    });

    it("maps horizon to edge of disc (r ~= 1)", () => {
      const p = stereographic({ altitude: 0, azimuth: 0 });
      const r = Math.sqrt(p.x ** 2 + p.y ** 2);
      expect(r).toBeCloseTo(1, 1);
    });
  });

  describe("azimuthalEquidistant", () => {
    it("maps zenith to center", () => {
      const p = azimuthalEquidistant({ altitude: 90, azimuth: 0 });
      expect(p.x).toBeCloseTo(0, 1);
      expect(p.y).toBeCloseTo(0, 1);
    });

    it("maps horizon to r = 1", () => {
      const p = azimuthalEquidistant({ altitude: 0, azimuth: 90 });
      const r = Math.sqrt(p.x ** 2 + p.y ** 2);
      expect(r).toBeCloseTo(1, 1);
    });

    it("maps 45° altitude to r = 0.5", () => {
      const p = azimuthalEquidistant({ altitude: 45, azimuth: 0 });
      const r = Math.sqrt(p.x ** 2 + p.y ** 2);
      expect(r).toBeCloseTo(0.5, 1);
    });
  });

  describe("toCanvasCoords", () => {
    it("maps center to canvas center", () => {
      const cp = toCanvasCoords({ x: 0, y: 0 }, 800, 600, 0);
      expect(cp.x).toBeCloseTo(400);
      expect(cp.y).toBeCloseTo(300);
    });
  });

  describe("isAboveHorizon", () => {
    it("returns true for positive altitude", () => {
      expect(isAboveHorizon({ altitude: 10, azimuth: 0 })).toBe(true);
    });

    it("returns false for negative altitude", () => {
      expect(isAboveHorizon({ altitude: -5, azimuth: 180 })).toBe(false);
    });
  });
});
