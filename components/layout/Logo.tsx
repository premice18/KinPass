import { useId } from 'react'

/**
 * Logo Kin Pass — billet « ticket » premium.
 * Forme de billet avec encoches latérales (perforation), dégradé electric→cyan,
 * reflet supérieur et coche blanche symbolisant la validation d'accès.
 * Taille pilotée par `className` (ex. `h-8 w-8`).
 */
export function Logo({ className }: { className?: string }) {
  const id = useId()
  const gradientId = `kp-grad-${id}`
  const shineId = `kp-shine-${id}`
  const maskId = `kp-mask-${id}`

  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="8" y1="10" x2="40" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id={shineId} x1="6" y1="10" x2="42" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <mask id={maskId}>
          <rect x="0" y="0" width="48" height="48" fill="white" />
          <circle cx="9" cy="24" r="5" fill="black" />
          <circle cx="39" cy="24" r="5" fill="black" />
        </mask>
      </defs>

      {/* Corps du billet avec encoches gauche/droite via masque */}
      <g mask={`url(#${maskId})`}>
        <rect x="6" y="10" width="36" height="28" rx="4" fill={`url(#${gradientId})`} />
        <rect x="6" y="10" width="36" height="15" rx="4" fill={`url(#${shineId})`} />
      </g>

      {/* Ligne de perforation (talon détachable) */}
      <line
        x1="19"
        y1="13"
        x2="19"
        y2="35"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />

      {/* Coche de validation */}
      <path
        d="M27 24l3 3 6.5-6.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
