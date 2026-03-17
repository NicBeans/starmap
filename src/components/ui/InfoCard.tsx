"use client";

interface InfoCardProps {
  object: {
    id: string;
    name: string;
    type: string;
    details: Record<string, string>;
  } | null;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
}

export default function InfoCard({
  object,
  isFavorite,
  onClose,
  onToggleFavorite,
}: InfoCardProps) {
  if (!object) return null;

  return (
    <div
      role="dialog"
      aria-label={`Details for ${object.name}`}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-80 max-w-[calc(100vw-2rem)] glass-panel overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-sky-border">
        <div>
          <h3 className="text-sky-text font-semibold">{object.name}</h3>
          <span className="text-xs text-sky-text-dim capitalize">{object.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFavorite}
            aria-label={isFavorite ? `Remove ${object.name} from favorites` : `Add ${object.name} to favorites`}
            className="text-sky-text-muted hover:text-sky-favorite transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {isFavorite ? (
              <svg className="w-5 h-5 fill-sky-favorite" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="text-sky-text-muted hover:text-sky-text transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <dl className="px-4 py-3 space-y-2">
        {Object.entries(object.details).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <dt className="text-sky-text-muted">{key}</dt>
            <dd className="text-sky-text">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
