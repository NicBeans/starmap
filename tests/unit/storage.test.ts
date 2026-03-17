import { describe, it, expect, beforeEach } from "vitest";
import {
  getPreferences,
  setPreferences,
  getFavorites,
  addFavorite,
  removeFavorite,
  getRecentSearches,
  addRecentSearch,
} from "@/lib/storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("preferences", () => {
    it("returns defaults when nothing saved", () => {
      const prefs = getPreferences();
      expect(prefs.quality).toBe("auto");
      expect(prefs.viewMode).toBe("3d");
      expect(prefs.showConstellationLines).toBe(true);
    });

    it("persists changes", () => {
      setPreferences({ quality: "high" });
      const prefs = getPreferences();
      expect(prefs.quality).toBe("high");
      expect(prefs.viewMode).toBe("3d"); // unchanged
    });
  });

  describe("favorites", () => {
    it("starts empty", () => {
      expect(getFavorites()).toEqual([]);
    });

    it("adds and retrieves favorites", () => {
      addFavorite({ id: "star_1", name: "Sirius", type: "star" });
      const favs = getFavorites();
      expect(favs).toHaveLength(1);
      expect(favs[0].name).toBe("Sirius");
      expect(favs[0].addedAt).toBeGreaterThan(0);
    });

    it("prevents duplicates", () => {
      addFavorite({ id: "star_1", name: "Sirius", type: "star" });
      addFavorite({ id: "star_1", name: "Sirius", type: "star" });
      expect(getFavorites()).toHaveLength(1);
    });

    it("removes favorites", () => {
      addFavorite({ id: "star_1", name: "Sirius", type: "star" });
      addFavorite({ id: "star_2", name: "Vega", type: "star" });
      removeFavorite("star_1");
      const favs = getFavorites();
      expect(favs).toHaveLength(1);
      expect(favs[0].name).toBe("Vega");
    });
  });

  describe("recent searches", () => {
    it("starts empty", () => {
      expect(getRecentSearches()).toEqual([]);
    });

    it("adds searches in order", () => {
      addRecentSearch("London");
      addRecentSearch("Tokyo");
      const recent = getRecentSearches();
      expect(recent[0]).toBe("Tokyo");
      expect(recent[1]).toBe("London");
    });

    it("limits to 10 entries", () => {
      for (let i = 0; i < 15; i++) {
        addRecentSearch(`City ${i}`);
      }
      expect(getRecentSearches()).toHaveLength(10);
    });

    it("deduplicates", () => {
      addRecentSearch("London");
      addRecentSearch("Tokyo");
      addRecentSearch("London");
      const recent = getRecentSearches();
      expect(recent).toHaveLength(2);
      expect(recent[0]).toBe("London");
    });
  });
});
