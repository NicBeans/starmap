"use client";

import type { UserPreferences, QualityLevel } from "@/lib/storage";

interface SettingsPanelProps {
  visible: boolean;
  preferences: UserPreferences;
  onClose: () => void;
  onUpdatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
}

const QUALITY_OPTIONS: { value: QualityLevel; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function SettingsPanel({
  visible,
  preferences,
  onClose,
  onUpdatePreference,
}: SettingsPanelProps) {
  if (!visible) return null;

  return (
    <div role="dialog" aria-label="Settings" aria-modal="true" className="absolute inset-0 z-30 flex items-center justify-center bg-sky-overlay backdrop-blur-sm">
      <div className="w-80 max-w-[calc(100vw-2rem)] glass-panel overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-sky-border">
          <h2 className="text-sky-text font-semibold">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="text-sky-text-muted hover:text-sky-text transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <fieldset>
            <legend className="text-xs text-sky-text-muted block mb-2">Render Quality</legend>
            <div className="flex gap-1 bg-sky-hover rounded-lg p-1" role="radiogroup">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={preferences.quality === opt.value}
                  onClick={() => onUpdatePreference("quality", opt.value)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    preferences.quality === opt.value
                      ? "bg-sky-accent text-white"
                      : "text-sky-text-muted hover:text-sky-text"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-3">
            <Toggle label="Constellation Lines" checked={preferences.showConstellationLines} onChange={(v) => onUpdatePreference("showConstellationLines", v)} />
            <Toggle label="Labels" checked={preferences.showLabels} onChange={(v) => onUpdatePreference("showLabels", v)} />
            <Toggle label="Coordinate Grid" checked={preferences.showGrid} onChange={(v) => onUpdatePreference("showGrid", v)} />
            <Toggle label="Horizon" checked={preferences.showHorizon} onChange={(v) => onUpdatePreference("showHorizon", v)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between cursor-pointer min-h-[44px]"
    >
      <span className="text-sm text-sky-text-muted">{label}</span>
      <div aria-hidden="true" className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-sky-accent" : "bg-sky-border"}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}
