/** Brand mark matching the logo: bubbly LOKA + map-pin O in sage. */
export function LokaWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center font-[family-name:var(--font-brand)] text-[1em] font-extrabold tracking-[0.02em] text-[#8a9a6e] drop-shadow-[0_3px_4px_rgba(26,26,24,0.12)] ${className}`}
      aria-label="Loka"
    >
      <span>L</span>
      <MapPinO className="mx-[0.01em] inline-block h-[0.92em] w-[0.72em] shrink-0 translate-y-[0.06em]" />
      <span>KA</span>
    </span>
  );
}

/** Filled location pin with cream center hole — the “O”. */
function MapPinO({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#8a9a6e"
        d="M36 4C19.4 4 6 17.4 6 34c0 22.5 24.8 49.2 28.4 53.2a2.4 2.4 0 0 0 3.2 0C41.2 83.2 66 56.5 66 34 66 17.4 52.6 4 36 4z"
      />
      <circle cx="36" cy="33" r="14" fill="#f5f0e6" />
    </svg>
  );
}
