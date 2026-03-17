import { getGPUTier } from "detect-gpu";
import type { QualityLevel } from "./storage";

export interface LODConfig {
  maxStarMagnitude: number;
  showDSO: boolean;
  maxDSOMagnitude: number;
  starPointSize: number;
  enableBloom: boolean;
  labelDensity: "none" | "bright" | "all";
}

const LOD_CONFIGS: Record<Exclude<QualityLevel, "auto">, LODConfig> = {
  low: {
    maxStarMagnitude: 4.0,
    showDSO: false,
    maxDSOMagnitude: 0,
    starPointSize: 3,
    enableBloom: false,
    labelDensity: "none",
  },
  medium: {
    maxStarMagnitude: 6.0,
    showDSO: true,
    maxDSOMagnitude: 8.0,
    starPointSize: 4,
    enableBloom: false,
    labelDensity: "bright",
  },
  high: {
    maxStarMagnitude: 12.0,
    showDSO: true,
    maxDSOMagnitude: 14.0,
    starPointSize: 5,
    enableBloom: true,
    labelDensity: "all",
  },
};

let detectedTier: number | null = null;

export async function detectQuality(): Promise<Exclude<QualityLevel, "auto">> {
  if (detectedTier !== null) {
    return tierToQuality(detectedTier);
  }

  try {
    const result = await getGPUTier();
    detectedTier = result.tier;
    return tierToQuality(result.tier);
  } catch {
    detectedTier = 1;
    return "low";
  }
}

function tierToQuality(tier: number): Exclude<QualityLevel, "auto"> {
  if (tier >= 3) return "high";
  if (tier >= 2) return "medium";
  return "low";
}

export function getLODConfig(quality: QualityLevel): LODConfig | null {
  if (quality === "auto") return null; // caller should resolve auto first
  return LOD_CONFIGS[quality];
}

/**
 * Get effective magnitude limit based on quality and zoom level.
 * Zooming in reveals fainter objects.
 */
export function getEffectiveMagnitudeLimit(
  baseMag: number,
  zoomLevel: number
): number {
  // Each doubling of zoom adds ~2 magnitudes of depth
  const zoomBonus = Math.log2(Math.max(1, zoomLevel)) * 2;
  return baseMag + zoomBonus;
}
