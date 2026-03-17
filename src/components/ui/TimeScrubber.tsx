"use client";

import { useCallback } from "react";

interface TimeScrubberProps {
  currentTime: Date;
  isRealtime: boolean;
  isPlaying: boolean;
  onTimeChange: (date: Date) => void;
  onSnapToNow: () => void;
  onTogglePlay: () => void;
  visible: boolean;
  onClose: () => void;
}

export default function TimeScrubber({
  currentTime,
  isRealtime,
  isPlaying,
  onTimeChange,
  onSnapToNow,
  onTogglePlay,
  visible,
  onClose,
}: TimeScrubberProps) {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const offsetHours = parseFloat(e.target.value);
      const newTime = new Date();
      newTime.setTime(newTime.getTime() + offsetHours * 3600000);
      onTimeChange(newTime);
    },
    [onTimeChange]
  );

  const currentOffset = (currentTime.getTime() - Date.now()) / 3600000;

  if (!visible) return null;

  return (
    <div role="region" aria-label="Time control" className="absolute bottom-16 left-0 right-0 z-20 px-4 pb-2">
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-sky-text-muted" id="time-control-label">Time Control</span>
          <div className="flex items-center gap-2">
            {!isRealtime && (
              <button
                onClick={onSnapToNow}
                aria-label="Snap to current time"
                className="text-xs text-sky-accent hover:text-sky-accent-hover transition-colors cursor-pointer min-h-[44px] flex items-center"
              >
                Now
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close time control"
              className="text-sky-text-dim hover:text-sky-text transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-center mb-2">
          <span className="text-sky-text text-sm font-medium" aria-live="polite">
            {currentTime.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <label htmlFor="time-slider" className="sr-only">Time offset in hours</label>
        <input
          id="time-slider"
          type="range"
          min={-24}
          max={24}
          step={0.25}
          value={Math.max(-24, Math.min(24, currentOffset))}
          onChange={handleSliderChange}
          aria-labelledby="time-control-label"
          aria-valuetext={`${currentOffset > 0 ? "+" : ""}${currentOffset.toFixed(1)} hours from now`}
          className="w-full h-1 bg-sky-border rounded-lg appearance-none cursor-pointer accent-sky-accent"
        />

        <div className="flex justify-between text-[10px] text-sky-text-dim mt-1" aria-hidden="true">
          <span>-24h</span>
          <span>Now</span>
          <span>+24h</span>
        </div>

        <div className="flex justify-center mt-3">
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause time animation" : "Play time animation"}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-sky-hover hover:bg-sky-border transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-sky-text" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-sky-text ml-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
