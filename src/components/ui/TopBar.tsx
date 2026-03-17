"use client";

import type { ViewMode } from "@/lib/storage";

interface TopBarProps {
  locationName: string;
  currentTime: Date;
  isRealtime: boolean;
  viewMode: ViewMode;
  onLocationClick: () => void;
  onViewToggle: () => void;
  onSettingsClick: () => void;
  onTimeClick: () => void;
}

export default function TopBar({
  locationName,
  currentTime,
  isRealtime,
  viewMode,
  onLocationClick,
  onViewToggle,
  onSettingsClick,
  onTimeClick,
}: TopBarProps) {
  const timeStr = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = currentTime.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <nav
      aria-label="Sky viewer controls"
      className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <button
        onClick={onLocationClick}
        aria-label={`Change location, currently ${locationName}`}
        className="flex items-center gap-2 text-sm text-sky-text-muted hover:text-sky-text transition-colors cursor-pointer min-h-[44px]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="max-w-[140px] truncate">{locationName}</span>
      </button>

      <button
        onClick={onTimeClick}
        aria-label={`Time control, currently ${timeStr} ${dateStr}${!isRealtime ? " (manual)" : ""}`}
        className="flex flex-col items-center text-sky-text-muted hover:text-sky-text transition-colors cursor-pointer min-h-[44px] justify-center"
      >
        <span className="text-sm font-medium">{timeStr}</span>
        <span className="text-xs text-sky-text-dim">
          {dateStr}
          {!isRealtime && " (manual)"}
        </span>
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={onViewToggle}
          aria-label={`Switch to ${viewMode === "3d" ? "2D" : "3D"} view`}
          className="px-2 py-1 text-xs font-medium text-sky-text-muted border border-sky-border rounded hover:bg-sky-hover transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {viewMode === "3d" ? "3D" : "2D"}
        </button>

        <button
          onClick={onSettingsClick}
          aria-label="Open settings"
          className="text-sky-text-muted hover:text-sky-text transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
