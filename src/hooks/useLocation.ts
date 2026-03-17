"use client";

import { useState, useEffect, useCallback } from "react";
import type { LatLng } from "@/lib/coordinates";
import { getSavedLocation, setSavedLocation } from "@/lib/storage";

interface UseLocationReturn {
  location: LatLng | null;
  locationName: string;
  loading: boolean;
  error: string | null;
  requestGPS: () => void;
  setManualLocation: (lat: number, lng: number, name?: string) => void;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [locationName, setLocationName] = useState("Unknown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved location on mount
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setLocation({ lat: saved.lat, lng: saved.lng });
      setLocationName(saved.name);
    }
  }, []);

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(loc);
        setLocationName(
          `${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}`
        );
        setSavedLocation({
          name: `${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}`,
          ...loc,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const setManualLocation = useCallback(
    (lat: number, lng: number, name?: string) => {
      const loc = { lat, lng };
      const displayName = name || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      setLocation(loc);
      setLocationName(displayName);
      setSavedLocation({ name: displayName, ...loc });
      setError(null);
    },
    []
  );

  return { location, locationName, loading, error, requestGPS, setManualLocation };
}
