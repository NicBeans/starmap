import type { LatLng } from "./coordinates";

export type QualityLevel = "low" | "medium" | "high" | "auto";
export type ViewMode = "3d" | "2d";

export interface UserPreferences {
  quality: QualityLevel;
  viewMode: ViewMode;
  showConstellationLines: boolean;
  showLabels: boolean;
  showGrid: boolean;
  showHorizon: boolean;
}

export interface SavedLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface FavoriteObject {
  id: string;
  name: string;
  type: "star" | "planet" | "dso" | "satellite";
  addedAt: number;
}

const KEYS = {
  preferences: "starmap_preferences",
  location: "starmap_location",
  favorites: "starmap_favorites",
  recentSearches: "starmap_recent_searches",
} as const;

const DEFAULT_PREFERENCES: UserPreferences = {
  quality: "auto",
  viewMode: "3d",
  showConstellationLines: true,
  showLabels: true,
  showGrid: false,
  showHorizon: true,
};

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export function getPreferences(): UserPreferences {
  return getItem(KEYS.preferences, DEFAULT_PREFERENCES);
}

export function setPreferences(prefs: Partial<UserPreferences>): void {
  const current = getPreferences();
  setItem(KEYS.preferences, { ...current, ...prefs });
}

export function getSavedLocation(): SavedLocation | null {
  return getItem<SavedLocation | null>(KEYS.location, null);
}

export function setSavedLocation(location: SavedLocation): void {
  setItem(KEYS.location, location);
}

export function getFavorites(): FavoriteObject[] {
  return getItem<FavoriteObject[]>(KEYS.favorites, []);
}

export function addFavorite(obj: Omit<FavoriteObject, "addedAt">): void {
  const favorites = getFavorites();
  if (favorites.some((f) => f.id === obj.id)) return;
  favorites.push({ ...obj, addedAt: Date.now() });
  setItem(KEYS.favorites, favorites);
}

export function removeFavorite(id: string): void {
  const favorites = getFavorites().filter((f) => f.id !== id);
  setItem(KEYS.favorites, favorites);
}

export function getRecentSearches(): string[] {
  return getItem<string[]>(KEYS.recentSearches, []);
}

export function addRecentSearch(query: string): void {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  setItem(KEYS.recentSearches, recent.slice(0, 10));
}
