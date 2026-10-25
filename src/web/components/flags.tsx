// Inline SVG flags: emoji flags render as plain letters ("BR", "US") on Windows.
export function FlagBR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} aria-hidden>
      <rect width="20" height="14" rx="2" fill="#009c3b" />
      <path d="M10 2 L18 7 L10 12 L2 7 Z" fill="#ffdf00" />
      <circle cx="10" cy="7" r="3.2" fill="#002776" />
      <path d="M7 6.4 Q10 5.6 13 7.4" stroke="#fff" strokeWidth="0.7" fill="none" />
    </svg>
  );
}

export function FlagUS({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} aria-hidden>
      <clipPath id="flag-us-clip">
        <rect width="20" height="14" rx="2" />
      </clipPath>
      <g clipPath="url(#flag-us-clip)">
        <rect width="20" height="14" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12].map((y) => (
          <rect key={y} y={y} width="20" height="1.08" fill="#b22234" />
        ))}
        <rect width="9" height="7.5" fill="#3c3b6e" />
        {[1.5, 3.7, 5.9].map((y) => [1.5, 3.5, 5.5, 7.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" fill="#fff" />))}
      </g>
    </svg>
  );
}
