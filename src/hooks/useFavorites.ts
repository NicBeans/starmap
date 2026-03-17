"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  type FavoriteObject,
} from "@/lib/storage";

interface UseFavoritesReturn {
  favorites: FavoriteObject[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (obj: Omit<FavoriteObject, "addedAt">) => void;
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteObject[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (obj: Omit<FavoriteObject, "addedAt">) => {
      if (favorites.some((f) => f.id === obj.id)) {
        removeFavorite(obj.id);
      } else {
        addFavorite(obj);
      }
      setFavorites(getFavorites());
    },
    [favorites]
  );

  return { favorites, isFavorite, toggleFavorite };
}
