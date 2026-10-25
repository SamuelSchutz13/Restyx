/** The Restyx mark (same drawing as the favicon): a request going out and a response coming back. */
export function Logo({ className = 'size-6' }: { className?: string }) {
  return (
    <svg data-logo viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#090d0b" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="none" stroke="#22302a" />
      <path d="M8 12h15m-4-4 4 4-4 4" fill="none" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 21H9m4-4-4 4 4 4" fill="none" stroke="#2dd4bf" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
