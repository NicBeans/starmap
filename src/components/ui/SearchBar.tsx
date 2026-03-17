"use client";

import { useState, useCallback } from "react";
import { searchObjects } from "@/lib/catalog";
import type { StarData, DSOData } from "@/lib/catalog";

interface SearchBarProps {
  onSelectObject: (obj: StarData | DSOData) => void;
}

function isStarData(obj: StarData | DSOData): obj is StarData {
  return "mag" in obj && "ra" in obj && !("sizeArcmin" in obj);
}

export default function SearchBar({ onSelectObject }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(StarData | DSOData)[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      setResults(searchObjects(value, 10));
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, []);

  const handleSelect = useCallback((obj: StarData | DSOData) => {
    onSelectObject(obj);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }, [onSelectObject]);

  return (
    <div className="relative w-full" role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <label htmlFor="sky-search" className="sr-only">Search stars, planets, objects</label>
        <input
          id="sky-search"
          type="text"
          placeholder="Search stars, planets, objects..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          aria-autocomplete="list"
          aria-controls="search-results"
          className="w-full pl-9 pr-4 py-2 bg-sky-hover border border-sky-border rounded-lg text-sm text-sky-text placeholder-sky-text-dim focus:outline-none focus:border-sky-accent-muted min-h-[44px]"
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul id="search-results" role="listbox" aria-label="Search results" className="absolute top-full mt-1 w-full glass-panel overflow-hidden max-h-60 overflow-y-auto scrollable-panel z-30">
          {results.map((obj) => {
            const name = isStarData(obj) ? obj.name || obj.bayer || `HIP ${obj.hip}` : (obj as DSOData).name || (obj as DSOData).id;
            const type = isStarData(obj) ? "Star" : (obj as DSOData).type;
            const detail = isStarData(obj) ? `mag ${obj.mag}` : `mag ${(obj as DSOData).mag}`;
            const key = isStarData(obj) ? `star_${obj.id}` : (obj as DSOData).id;

            return (
              <li key={key} role="option" aria-selected={false}>
                <button
                  onClick={() => handleSelect(obj)}
                  className="w-full px-4 py-2 flex items-center justify-between hover:bg-sky-hover transition-colors text-left cursor-pointer min-h-[44px]"
                >
                  <div>
                    <span className="text-sm text-sky-text">{name}</span>
                    <span className="ml-2 text-xs text-sky-text-dim capitalize">{type}</span>
                  </div>
                  <span className="text-xs text-sky-text-dim">{detail}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
