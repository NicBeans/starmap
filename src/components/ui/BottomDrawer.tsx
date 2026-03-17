"use client";

import { useState } from "react";
import SearchBar from "./SearchBar";
import type { StarData, DSOData } from "@/lib/catalog";
import type { SatellitePass } from "@/lib/satellites";
import type { FavoriteObject } from "@/lib/storage";

interface BottomDrawerProps {
  onSelectObject: (obj: StarData | DSOData) => void;
  passes: SatellitePass[];
  favorites: FavoriteObject[];
  onFavoriteClick: (id: string) => void;
}

type Tab = "search" | "passes" | "favorites";

export default function BottomDrawer({
  onSelectObject,
  passes,
  favorites,
  onFavoriteClick,
}: BottomDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("search");

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-10 transition-transform duration-300 ${
        isExpanded ? "translate-y-0" : "translate-y-[calc(100%-3.5rem)]"
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? "Collapse drawer" : "Expand drawer"}
        aria-expanded={isExpanded}
        className="flex justify-center py-2 cursor-pointer w-full min-h-[44px] items-center"
      >
        <div className="w-10 h-1 bg-sky-text-dim rounded-full" aria-hidden="true" />
      </button>

      <div
        role="region"
        aria-label="Sky object search and satellite passes"
        className="glass-panel rounded-b-none border-b-0 min-h-[16rem]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div role="tablist" aria-label="Drawer tabs" className="flex gap-1 px-4 pt-2 pb-2">
          {(["search", "passes", "favorites"] as Tab[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab}`}
              onClick={() => { setActiveTab(tab); setIsExpanded(true); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize cursor-pointer ${
                activeTab === tab
                  ? "bg-sky-hover text-sky-text"
                  : "text-sky-text-dim hover:text-sky-text-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4">
          <div id="tabpanel-search" role="tabpanel" hidden={activeTab !== "search"}>
            {activeTab === "search" && <SearchBar onSelectObject={onSelectObject} />}
          </div>

          <div id="tabpanel-passes" role="tabpanel" hidden={activeTab !== "passes"}>
            {activeTab === "passes" && (
              <div className="space-y-2 max-h-48 overflow-y-auto scrollable-panel">
                {passes.length === 0 ? (
                  <p className="text-sm text-sky-text-dim text-center py-4">
                    No upcoming passes. Set your location and wait for satellite data.
                  </p>
                ) : (
                  passes.map((pass, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-sky-border last:border-0">
                      <div>
                        <span className="text-sm text-sky-text">{pass.satelliteName}</span>
                        <div className="text-xs text-sky-text-dim">
                          {pass.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                          - Peak {pass.peakAltitude.toFixed(0)}°
                        </div>
                      </div>
                      <span className="text-xs text-sky-text-dim">mag {pass.brightness.toFixed(1)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div id="tabpanel-favorites" role="tabpanel" hidden={activeTab !== "favorites"}>
            {activeTab === "favorites" && (
              <div className="space-y-1 max-h-48 overflow-y-auto scrollable-panel">
                {favorites.length === 0 ? (
                  <p className="text-sm text-sky-text-dim text-center py-4">
                    No favorites yet. Tap a star or planet to add one.
                  </p>
                ) : (
                  favorites.map((fav) => (
                    <button
                      key={fav.id}
                      onClick={() => onFavoriteClick(fav.id)}
                      className="w-full flex items-center justify-between px-2 py-2 hover:bg-sky-hover rounded-lg transition-colors cursor-pointer min-h-[44px]"
                    >
                      <span className="text-sm text-sky-text">{fav.name}</span>
                      <span className="text-xs text-sky-text-dim capitalize">{fav.type}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
