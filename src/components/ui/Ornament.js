/** Decorative line ornaments and the wedding symbol, drawn as inline SVG. */

export function Divider({ className, width = 180 }) {
  return (
    <svg className={className} width={width} viewBox="0 0 180 20" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="0.8" strokeLinecap="round">
        <path d="M4 10H64" />
        <path d="M64 10c6 0 8-5 12-5 3 0 4 3 2 4.5" />
        <path d="M70 10c4 0 6 3 9 3" opacity="0.7" />
        <g transform="translate(180 0) scale(-1 1)">
          <path d="M4 10H64" />
          <path d="M64 10c6 0 8-5 12-5 3 0 4 3 2 4.5" />
          <path d="M70 10c4 0 6 3 9 3" opacity="0.7" />
        </g>
      </g>
      <path d="M90 3.5 94.5 10 90 16.5 85.5 10Z" fill="currentColor" />
      <circle cx="80" cy="10" r="1" fill="currentColor" />
      <circle cx="100" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

export function WeddingSymbol({ className, size = 84 }) {
  return (
    <svg className={className} width={size} height={size * 0.78} viewBox="0 0 110 86" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeLinecap="round">
        {/* laurel left */}
        <path d="M18 70C8 58 7 40 16 26" strokeWidth="0.9" />
        <path d="M14 60c-5-1-8-4-9-8 5 0 8 3 9 8Z M12 49c-5-2-7-6-7-10 4 1 7 5 7 10Z M13 38c-4-3-5-7-4-11 4 2 5 6 4 11Z" strokeWidth="0.7" />
        {/* laurel right */}
        <g transform="translate(110 0) scale(-1 1)">
          <path d="M18 70C8 58 7 40 16 26" strokeWidth="0.9" />
          <path d="M14 60c-5-1-8-4-9-8 5 0 8 3 9 8Z M12 49c-5-2-7-6-7-10 4 1 7 5 7 10Z M13 38c-4-3-5-7-4-11 4 2 5 6 4 11Z" strokeWidth="0.7" />
        </g>
        {/* rings */}
        <circle cx="46" cy="50" r="15" strokeWidth="1.3" />
        <circle cx="64" cy="50" r="15" strokeWidth="1.3" />
        <circle cx="46" cy="50" r="12.5" strokeWidth="0.5" opacity="0.6" />
        <circle cx="64" cy="50" r="12.5" strokeWidth="0.5" opacity="0.6" />
      </g>
      {/* diamond */}
      <path d="M64 25l5 4-5 6-5-6Z" fill="currentColor" opacity="0.9" />
      <path d="M59 29h10" stroke="var(--ivory, #fff)" strokeWidth="0.5" opacity="0.7" />
      {/* sparkles */}
      <path d="M55 8l1.2 4 4 1.2-4 1.2L55 18.4l-1.2-4-4-1.2 4-1.2Z" fill="currentColor" />
      <circle cx="40" cy="20" r="1.1" fill="currentColor" opacity="0.7" />
      <circle cx="72" cy="15" r="0.9" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function Monogram({ className, left = 'D', right = 'S' }) {
  return (
    <span className={className} aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28em' }}>
      <span>{left}</span>
      <svg width="0.5em" height="0.5em" viewBox="0 0 10 10" style={{ display: 'inline-block' }}>
        <path d="M5 0.5 8.5 5 5 9.5 1.5 5Z" fill="currentColor" />
      </svg>
      <span>{right}</span>
    </span>
  );
}
