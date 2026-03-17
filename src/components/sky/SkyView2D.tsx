"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import type { StarData, ConstellationLine } from "@/lib/catalog";
import type { CelestialBody } from "@/lib/astronomy";
import type { SatellitePosition } from "@/lib/satellites";
import type { LODConfig } from "@/lib/lod";
import type { UserPreferences } from "@/lib/storage";
import { raDecToAltAz, type LatLng } from "@/lib/coordinates";
import { azimuthalEquidistant, toCanvasCoords, isAboveHorizon } from "@/lib/projection";

interface SkyView2DProps {
  stars: StarData[];
  constellationLines: ConstellationLine[];
  celestialBodies: CelestialBody[];
  satellites: SatellitePosition[];
  lodConfig: LODConfig;
  preferences: UserPreferences;
  location: LatLng;
  time: Date;
  onObjectClick?: (object: { id: string; name: string; type: string }) => void;
}

function spectralColorHex(type: string): string {
  switch (type) {
    case "O": return "#99aaff";
    case "B": return "#aabbff";
    case "A": return "#dde0ff";
    case "F": return "#ffffe6";
    case "G": return "#ffffaa";
    case "K": return "#ffdd99";
    case "M": return "#ffaa77";
    default: return "#ffffff";
  }
}

function magnitudeToRadius(mag: number): number {
  return Math.max(0.5, 3 - mag * 0.3);
}

const BODY_COLORS: Record<string, string> = {
  Sun: "#ffdd44", Moon: "#ccccdd", Mercury: "#aaaaaa", Venus: "#ffffcc",
  Mars: "#ff6644", Jupiter: "#ffcc88", Saturn: "#ffddaa", Uranus: "#88ccff", Neptune: "#4466ff",
};

export default function SkyView2D({
  stars,
  constellationLines,
  celestialBodies,
  satellites,
  lodConfig,
  preferences,
  location,
  time,
  onObjectClick,
}: SkyView2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Memoize HIP index so it's not rebuilt every frame
  const hipMap = useMemo(() => {
    const map = new Map<number, StarData>();
    for (const s of stars) {
      if (s.hip) map.set(s.hip, s);
    }
    return map;
  }, [stars]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const needsResize =
      canvas.width !== Math.round(rect.width * dpr) ||
      canvas.height !== Math.round(rect.height * dpr);

    if (needsResize) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const w = rect.width;
    const h = rect.height;
    sizeRef.current = { w, h };

    // Clear
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, w, h);

    // Horizon circle
    if (preferences.showHorizon) {
      const center = toCanvasCoords({ x: 0, y: 0 }, w, h);
      const edgePoint = toCanvasCoords({ x: 1, y: 0 }, w, h);
      const radius = edgePoint.x - center.x;

      ctx.strokeStyle = "#334466";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      const cardinals = [
        { label: "N", az: 0 }, { label: "E", az: 90 },
        { label: "S", az: 180 }, { label: "W", az: 270 },
      ];
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const { label, az } of cardinals) {
        const p = azimuthalEquidistant({ altitude: 0, azimuth: az });
        const cp = toCanvasCoords(p, w, h);
        ctx.fillStyle = "#5588aa";
        ctx.fillText(label, cp.x, cp.y + 14);
      }
    }

    // Grid
    if (preferences.showGrid) {
      ctx.save();
      ctx.strokeStyle = "#1a2a3a";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      for (let alt = 30; alt <= 90; alt += 30) {
        const p = azimuthalEquidistant({ altitude: alt, azimuth: 0 });
        const cp = toCanvasCoords(p, w, h);
        const center = toCanvasCoords({ x: 0, y: 0 }, w, h);
        const r = Math.abs(cp.y - center.y);
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Constellation lines
    if (preferences.showConstellationLines) {
      ctx.save();
      ctx.strokeStyle = "#223355";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.4;

      for (const c of constellationLines) {
        for (const [h1, h2] of c.segments) {
          const s1 = hipMap.get(h1);
          const s2 = hipMap.get(h2);
          if (!s1 || !s2) continue;

          const aa1 = raDecToAltAz({ ra: s1.ra, dec: s1.dec }, location, time);
          const aa2 = raDecToAltAz({ ra: s2.ra, dec: s2.dec }, location, time);
          if (!isAboveHorizon(aa1) && !isAboveHorizon(aa2)) continue;

          const p1 = toCanvasCoords(azimuthalEquidistant(aa1), w, h);
          const p2 = toCanvasCoords(azimuthalEquidistant(aa2), w, h);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Stars
    const filteredStars = stars.filter((s) => s.mag <= lodConfig.maxStarMagnitude);
    for (const star of filteredStars) {
      const altAz = raDecToAltAz({ ra: star.ra, dec: star.dec }, location, time);
      if (!isAboveHorizon(altAz)) continue;

      const projected = azimuthalEquidistant(altAz);
      const cp = toCanvasCoords(projected, w, h);
      const radius = magnitudeToRadius(star.mag);

      ctx.save();
      ctx.fillStyle = spectralColorHex(star.spectralType || "");
      ctx.globalAlpha = Math.max(0.3, 1 - star.mag / 8);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Planets
    for (const body of celestialBodies) {
      if (body.altitude <= 0) continue;
      const projected = azimuthalEquidistant({ altitude: body.altitude, azimuth: body.azimuth });
      const cp = toCanvasCoords(projected, w, h);
      const color = BODY_COLORS[body.name] || "#ffffff";
      const size = body.name === "Sun" || body.name === "Moon" ? 6 : 4;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, size, 0, Math.PI * 2);
      ctx.fill();

      if (preferences.showLabels) {
        ctx.fillStyle = color;
        ctx.font = "11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(body.name, cp.x, cp.y - size - 4);
      }
    }

    // Satellites
    for (const sat of satellites) {
      if (sat.altitude <= 0) continue;
      const projected = azimuthalEquidistant({ altitude: sat.altitude, azimuth: sat.azimuth });
      const cp = toCanvasCoords(projected, w, h);

      ctx.save();
      ctx.fillStyle = "#44ff88";
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 2, 0, Math.PI * 2);
      ctx.fill();

      if (preferences.showLabels) {
        ctx.font = "9px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(sat.name, cp.x, cp.y - 6);
      }
      ctx.restore();
    }
  }, [stars, constellationLines, celestialBodies, satellites, lodConfig, preferences, location, time, hipMap]);

  // Click/tap handler for object selection
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onObjectClick) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { w, h } = sizeRef.current;
      const hitRadius = 15; // px tolerance

      // Check planets first (larger targets)
      for (const body of celestialBodies) {
        if (body.altitude <= 0) continue;
        const projected = azimuthalEquidistant({ altitude: body.altitude, azimuth: body.azimuth });
        const cp = toCanvasCoords(projected, w, h);
        const dist = Math.hypot(cp.x - x, cp.y - y);
        if (dist < hitRadius) {
          onObjectClick({ id: body.id, name: body.name, type: body.type });
          return;
        }
      }

      // Check satellites
      for (const sat of satellites) {
        if (sat.altitude <= 0) continue;
        const projected = azimuthalEquidistant({ altitude: sat.altitude, azimuth: sat.azimuth });
        const cp = toCanvasCoords(projected, w, h);
        const dist = Math.hypot(cp.x - x, cp.y - y);
        if (dist < hitRadius) {
          onObjectClick({ id: sat.id, name: sat.name, type: "satellite" });
          return;
        }
      }

      // Check bright stars
      const filteredStars = stars.filter((s) => s.mag <= Math.min(lodConfig.maxStarMagnitude, 6));
      for (const star of filteredStars) {
        const altAz = raDecToAltAz({ ra: star.ra, dec: star.dec }, location, time);
        if (!isAboveHorizon(altAz)) continue;
        const projected = azimuthalEquidistant(altAz);
        const cp = toCanvasCoords(projected, w, h);
        const dist = Math.hypot(cp.x - x, cp.y - y);
        if (dist < hitRadius) {
          onObjectClick({
            id: `star_${star.id}`,
            name: star.name || star.bayer || `HIP ${star.hip}`,
            type: "star",
          });
          return;
        }
      }
    },
    [onObjectClick, celestialBodies, satellites, stars, lodConfig, location, time]
  );

  // Animation loop + ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas);

    const tick = () => {
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ touchAction: "none" }}
      onClick={handleCanvasClick}
    />
  );
}
