"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPreferences,
  setPreferences,
  type UserPreferences,
  type QualityLevel,
  type ViewMode,
} from "@/lib/storage";
import { detectQuality, getLODConfig, type LODConfig } from "@/lib/lod";

interface UseSettingsReturn {
  preferences: UserPreferences;
  effectiveQuality: Exclude<QualityLevel, "auto">;
  lodConfig: LODConfig;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  setViewMode: (mode: ViewMode) => void;
  setQuality: (quality: QualityLevel) => void;
}

const DEFAULT_LOD: LODConfig = {
  maxStarMagnitude: 6.0,
  showDSO: true,
  maxDSOMagnitude: 8.0,
  starPointSize: 2.5,
  enableBloom: false,
  labelDensity: "bright",
};

export function useSettings(): UseSettingsReturn {
  const [preferences, setPrefs] = useState<UserPreferences>(getPreferences);
  const [effectiveQuality, setEffectiveQuality] = useState<
    Exclude<QualityLevel, "auto">
  >("medium");

  useEffect(() => {
    if (preferences.quality === "auto") {
      detectQuality().then(setEffectiveQuality);
    } else {
      setEffectiveQuality(preferences.quality);
    }
  }, [preferences.quality]);

  const lodConfig = getLODConfig(effectiveQuality) || DEFAULT_LOD;

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        setPreferences(next);
        return next;
      });
    },
    []
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => updatePreference("viewMode", mode),
    [updatePreference]
  );

  const setQuality = useCallback(
    (quality: QualityLevel) => updatePreference("quality", quality),
    [updatePreference]
  );

  return {
    preferences,
    effectiveQuality,
    lodConfig,
    updatePreference,
    setViewMode,
    setQuality,
  };
}
