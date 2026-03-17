"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLocation } from "@/hooks/useLocation";
import { useTime } from "@/hooks/useTime";
import { useFavorites } from "@/hooks/useFavorites";
import { useSettings } from "@/hooks/useSettings";
import { loadCatalogs, getStars, getConstellationLines, isLoaded } from "@/lib/catalog";
import { getCelestialBodies, type CelestialBody } from "@/lib/astronomy";
import { parseTLEs, getSatellitePosition, predictPasses, type TLEData, type SatellitePosition, type SatellitePass } from "@/lib/satellites";
import TopBar from "@/components/ui/TopBar";
import BottomDrawer from "@/components/ui/BottomDrawer";
import InfoCard from "@/components/ui/InfoCard";
import TimeScrubber from "@/components/ui/TimeScrubber";
import LocationPicker from "@/components/ui/LocationPicker";
import SettingsPanel from "@/components/ui/SettingsPanel";
import type { StarData, DSOData } from "@/lib/catalog";

// Dynamic import for 3D view (needs client-only WebGL)
const SkyView3D = dynamic(() => import("@/components/sky/SkyView3D"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-sky-text-dim text-sm">
      Loading 3D view...
    </div>
  ),
});

const SkyView2D = dynamic(() => import("@/components/sky/SkyView2D"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-sky-text-dim text-sm">
      Loading 2D view...
    </div>
  ),
});

export default function Home() {
  const { location, locationName, loading: locLoading, error: locError, requestGPS, setManualLocation } = useLocation();
  const { currentTime, isRealtime, isPlaying, setTime, snapToNow, togglePlay } = useTime();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { preferences, lodConfig, updatePreference, setViewMode } = useSettings();

  const [catalogReady, setCatalogReady] = useState(false);
  const [tles, setTles] = useState<TLEData[]>([]);
  const [satellites, setSatellites] = useState<SatellitePosition[]>([]);
  const [passes, setPasses] = useState<SatellitePass[]>([]);
  const [selectedObject, setSelectedObject] = useState<{
    id: string;
    name: string;
    type: string;
    details: Record<string, string>;
  } | null>(null);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTimeScrubber, setShowTimeScrubber] = useState(false);

  // Load star catalog on mount
  useEffect(() => {
    loadCatalogs().then(() => setCatalogReady(true));
  }, []);

  // Request GPS on first load if no saved location
  useEffect(() => {
    if (!location) {
      requestGPS();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch satellite TLEs
  useEffect(() => {
    async function fetchTLEs() {
      try {
        const res = await fetch("/api/tle?group=visual");
        if (!res.ok) return;
        const text = await res.text();
        setTles(parseTLEs(text));
      } catch {
        // Will retry on next interval
      }
    }
    fetchTLEs();
    const interval = setInterval(fetchTLEs, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute satellite positions
  useEffect(() => {
    if (!location || tles.length === 0) return;

    const positions = tles
      .slice(0, 500) // limit for performance
      .map((tle) => getSatellitePosition(tle, location, currentTime))
      .filter((p): p is SatellitePosition => p !== null);

    setSatellites(positions);
  }, [location, tles, currentTime]);

  // Predict passes (less frequent)
  useEffect(() => {
    if (!location || tles.length === 0) return;

    const importantTles = tles.slice(0, 50);
    const allPasses = importantTles
      .flatMap((tle) => predictPasses(tle, location, 24))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    setPasses(allPasses);
  }, [location, tles]); // only recompute when location or TLEs change

  // Compute celestial body positions
  const celestialBodies: CelestialBody[] = useMemo(() => {
    if (!location) return [];
    return getCelestialBodies(location, currentTime);
  }, [location, currentTime]);

  const stars = useMemo(() => (catalogReady ? getStars() : []), [catalogReady]);
  const constellationLines = useMemo(
    () => (catalogReady ? getConstellationLines() : []),
    [catalogReady]
  );

  const handleObjectClick = useCallback(
    (obj: { id: string; name: string; type: string }) => {
      const details: Record<string, string> = {};

      // Find star details
      if (obj.type === "star" && obj.id.startsWith("star_")) {
        const starId = parseInt(obj.id.replace("star_", ""), 10);
        const star = stars.find((s) => s.id === starId);
        if (star) {
          details["Magnitude"] = star.mag.toFixed(2);
          if (star.constellation) details["Constellation"] = star.constellation;
          if (star.spectralType) details["Spectral Type"] = star.spectralType;
          if (star.distance && star.distance > 0)
            details["Distance"] = `${star.distance.toFixed(1)} pc`;
          if (star.bayer) details["Designation"] = star.bayer;
        }
      }

      // Find celestial body details
      const body = celestialBodies.find((b) => b.id === obj.id);
      if (body) {
        details["Altitude"] = `${body.altitude.toFixed(1)}°`;
        details["Azimuth"] = `${body.azimuth.toFixed(1)}°`;
        details["Magnitude"] = body.magnitude.toFixed(1);
        details["Distance"] = `${body.distance.toFixed(3)} AU`;
        if (body.illumination !== undefined) {
          details["Illumination"] = `${(body.illumination * 100).toFixed(0)}%`;
        }
      }

      const sat = satellites.find((s) => s.id === obj.id);
      if (sat) {
        details["Altitude"] = `${sat.altitude.toFixed(1)}°`;
        details["Azimuth"] = `${sat.azimuth.toFixed(1)}°`;
        details["Height"] = `${sat.heightKm.toFixed(0)} km`;
        details["Range"] = `${sat.range.toFixed(0)} km`;
      }

      setSelectedObject({ ...obj, details });
    },
    [celestialBodies, satellites, stars]
  );

  const handleSelectSearchResult = useCallback(
    (obj: StarData | DSOData) => {
      const isStarData = "hip" in obj || !("sizeArcmin" in obj);
      if (isStarData) {
        const star = obj as StarData;
        const details: Record<string, string> = {};
        details["Magnitude"] = star.mag.toFixed(2);
        if (star.constellation) details["Constellation"] = star.constellation;
        if (star.spectralType) details["Spectral Type"] = star.spectralType;
        if (star.distance && star.distance > 0)
          details["Distance"] = `${star.distance.toFixed(1)} pc`;
        setSelectedObject({
          id: `star_${star.id}`,
          name: star.name || star.bayer || `HIP ${star.hip}`,
          type: "star",
          details,
        });
      } else {
        const dso = obj as DSOData;
        setSelectedObject({
          id: dso.id,
          name: dso.name || dso.id,
          type: dso.type,
          details: {
            Magnitude: dso.mag.toFixed(1),
            Constellation: dso.constellation,
            Size: `${dso.sizeArcmin}′`,
            Type: dso.type,
          },
        });
      }
    },
    []
  );

  const handleViewToggle = useCallback(() => {
    setViewMode(preferences.viewMode === "3d" ? "2d" : "3d");
  }, [preferences.viewMode, setViewMode]);

  if (!catalogReady) {
    return (
      <main className="relative h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sky-text-muted text-sm">Loading star catalog...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-full w-full">
      {/* Sky View */}
      <div className="absolute inset-0">
        {preferences.viewMode === "3d" ? (
          <SkyView3D
            stars={stars}
            constellationLines={constellationLines}
            celestialBodies={celestialBodies}
            satellites={satellites}
            lodConfig={lodConfig}
            preferences={preferences}
            onObjectClick={handleObjectClick}
          />
        ) : (
          location && (
            <SkyView2D
              stars={stars}
              constellationLines={constellationLines}
              celestialBodies={celestialBodies}
              satellites={satellites}
              lodConfig={lodConfig}
              preferences={preferences}
              location={location}
              time={currentTime}
            />
          )
        )}
      </div>

      {/* UI Overlays */}
      <TopBar
        locationName={locationName}
        currentTime={currentTime}
        isRealtime={isRealtime}
        viewMode={preferences.viewMode}
        onLocationClick={() => setShowLocationPicker(true)}
        onViewToggle={handleViewToggle}
        onSettingsClick={() => setShowSettings(true)}
        onTimeClick={() => setShowTimeScrubber(!showTimeScrubber)}
      />

      <BottomDrawer
        onSelectObject={handleSelectSearchResult}
        passes={passes}
        favorites={favorites}
        onFavoriteClick={(id) => {
          /* TODO: center on favorite */
        }}
      />

      <TimeScrubber
        currentTime={currentTime}
        isRealtime={isRealtime}
        isPlaying={isPlaying}
        onTimeChange={setTime}
        onSnapToNow={snapToNow}
        onTogglePlay={togglePlay}
        visible={showTimeScrubber}
        onClose={() => setShowTimeScrubber(false)}
      />

      <InfoCard
        object={selectedObject}
        isFavorite={selectedObject ? isFavorite(selectedObject.id) : false}
        onClose={() => setSelectedObject(null)}
        onToggleFavorite={() => {
          if (selectedObject) {
            toggleFavorite({
              id: selectedObject.id,
              name: selectedObject.name,
              type: selectedObject.type as "star" | "planet" | "dso" | "satellite",
            });
          }
        }}
      />

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onRequestGPS={requestGPS}
        onSetManual={setManualLocation}
        loading={locLoading}
        error={locError}
      />

      <SettingsPanel
        visible={showSettings}
        preferences={preferences}
        onClose={() => setShowSettings(false)}
        onUpdatePreference={updatePreference}
      />
    </main>
  );
}
