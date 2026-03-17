"use client";

import { useState, useCallback } from "react";

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onRequestGPS: () => void;
  onSetManual: (lat: number, lng: number, name?: string) => void;
  loading: boolean;
  error: string | null;
}

interface GeoResult {
  name: string;
  lat: number;
  lng: number;
}

export default function LocationPicker({
  visible,
  onClose,
  onRequestGPS,
  onSetManual,
  loading,
  error,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState<"search" | "manual">("search");

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, [searchQuery]);

  const handleManualSubmit = useCallback(() => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    onSetManual(lat, lng);
    onClose();
  }, [latInput, lngInput, onSetManual, onClose]);

  if (!visible) return null;

  return (
    <div role="dialog" aria-label="Set location" aria-modal="true" className="absolute inset-0 z-30 flex items-center justify-center bg-sky-overlay backdrop-blur-sm">
      <div className="w-96 max-w-[calc(100vw-2rem)] glass-panel overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-sky-border">
          <h2 className="text-sky-text font-semibold">Set Location</h2>
          <button
            onClick={onClose}
            aria-label="Close location picker"
            className="text-sky-text-muted hover:text-sky-text transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <button
            onClick={() => { onRequestGPS(); onClose(); }}
            disabled={loading}
            className="w-full py-2.5 bg-sky-accent hover:bg-sky-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {loading ? "Getting location..." : "Use GPS"}
          </button>

          {error && <p role="alert" className="text-sky-error text-xs text-center">{error}</p>}

          <div className="flex items-center gap-2 text-sky-text-dim text-xs" aria-hidden="true">
            <div className="flex-1 border-t border-sky-border" />
            <span>or</span>
            <div className="flex-1 border-t border-sky-border" />
          </div>

          <div className="flex gap-1 bg-sky-hover rounded-lg p-1" role="tablist" aria-label="Location input method">
            <button
              role="tab"
              aria-selected={mode === "search"}
              onClick={() => setMode("search")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${mode === "search" ? "bg-sky-border text-sky-text" : "text-sky-text-muted hover:text-sky-text"}`}
            >
              Search
            </button>
            <button
              role="tab"
              aria-selected={mode === "manual"}
              onClick={() => setMode("manual")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${mode === "manual" ? "bg-sky-border text-sky-text" : "text-sky-text-muted hover:text-sky-text"}`}
            >
              Lat/Long
            </button>
          </div>

          {mode === "search" ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <label htmlFor="location-search" className="sr-only">City or place name</label>
                <input
                  id="location-search"
                  type="text"
                  placeholder="City or place name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 px-3 py-2 bg-sky-hover border border-sky-border rounded-lg text-sm text-sky-text placeholder-sky-text-dim focus:outline-none focus:border-sky-accent-muted min-h-[44px]"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-4 py-2 bg-sky-border hover:bg-sky-text-dim disabled:cursor-not-allowed text-sky-text text-sm rounded-lg transition-colors cursor-pointer min-h-[44px]"
                >
                  {searching ? "..." : "Go"}
                </button>
              </div>

              {searchResults.length > 0 && (
                <ul className="max-h-40 overflow-y-auto scrollable-panel space-y-1" role="listbox" aria-label="Search results">
                  {searchResults.map((r, i) => (
                    <li key={i} role="option" aria-selected={false}>
                      <button
                        onClick={() => { onSetManual(r.lat, r.lng, r.name.split(",")[0]); onClose(); }}
                        className="w-full px-3 py-2 text-left text-sm text-sky-text-muted hover:bg-sky-hover rounded-lg transition-colors cursor-pointer min-h-[44px]"
                      >
                        <div className="truncate">{r.name}</div>
                        <div className="text-xs text-sky-text-dim">{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="lat-input" className="sr-only">Latitude</label>
                  <input id="lat-input" type="number" placeholder="Latitude" value={latInput} onChange={(e) => setLatInput(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-hover border border-sky-border rounded-lg text-sm text-sky-text placeholder-sky-text-dim focus:outline-none focus:border-sky-accent-muted min-h-[44px]" min={-90} max={90} step="any" />
                </div>
                <div className="flex-1">
                  <label htmlFor="lng-input" className="sr-only">Longitude</label>
                  <input id="lng-input" type="number" placeholder="Longitude" value={lngInput} onChange={(e) => setLngInput(e.target.value)}
                    className="w-full px-3 py-2 bg-sky-hover border border-sky-border rounded-lg text-sm text-sky-text placeholder-sky-text-dim focus:outline-none focus:border-sky-accent-muted min-h-[44px]" min={-180} max={180} step="any" />
                </div>
              </div>
              <button onClick={handleManualSubmit} className="w-full py-2 bg-sky-border hover:bg-sky-text-dim text-sky-text text-sm rounded-lg transition-colors cursor-pointer min-h-[44px]">
                Set Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
