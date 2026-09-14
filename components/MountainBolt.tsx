/** Decorative mountain-and-lightning illustration for the homepage's final
 * CTA panel — pure inline SVG (no image asset), tinted with the same accent
 * green used throughout the hero so it reads as part of the same brand. */
export function MountainBolt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 400" fill="none" className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="mtn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06100b" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="mtn-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f2417" />
          <stop offset="100%" stopColor="#06100b" />
        </linearGradient>
        <linearGradient id="mtn-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#132e1c" />
          <stop offset="100%" stopColor="#020504" />
        </linearGradient>
        <linearGradient id="bolt-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-to)" />
          <stop offset="100%" stopColor="var(--accent-from)" />
        </linearGradient>
        <filter id="bolt-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-from)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--accent-from)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="320" height="400" fill="url(#mtn-sky)" />
      <circle cx="230" cy="120" r="140" fill="url(#sun-glow)" />

      <path d="M-10 260 L60 150 L110 210 L170 110 L230 220 L280 170 L330 260 Z" fill="url(#mtn-back)" opacity="0.8" />
      <path d="M-10 330 L40 230 L95 290 L150 190 L210 300 L260 240 L330 330 L330 400 L-10 400 Z" fill="url(#mtn-front)" />

      <path
        d="M175 150 L140 235 L165 235 L145 320 L215 205 L185 205 Z"
        fill="url(#bolt-glow)"
        opacity="0.35"
        filter="url(#bolt-blur)"
      />
      <path
        d="M175 150 L140 235 L165 235 L145 320 L215 205 L185 205 Z"
        fill="url(#bolt-glow)"
        stroke="var(--accent-to)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
