'use client'

// ────────────────────────────────────────────────────────────────────────────
// Icône de menu animée — hamburger ⇄ flèche vers le haut.
//
// Les trois barres se transforment en une flèche pointant vers le haut :
// les deux barres supérieures deviennent la tête de la flèche et la barre
// inférieure devient sa tige. La flèche évoque « fermer / remonter », en
// cohérence avec le panneau overlay qui glisse depuis le haut.
//
// SVG personnalisé (trait 1.8, bouts ronds, style proche d'Iconoir) :
// c'est une icône volontairement originale qui ne ressemble ni à une croix
// classique ni au logo X/Twitter.
// ────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'

interface AnimatedMenuIconProps {
  open: boolean
  className?: string
}

// Courbe d'accélération douce (début rapide, fin lente).
const ease = [0.16, 1, 0.3, 1] as const

export function AnimatedMenuIcon({ open, className }: AnimatedMenuIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      {/* Barre du haut → bras gauche de la flèche */}
      <motion.line
        initial={false}
        animate={
          open
            ? { x1: 6, y1: 11, x2: 12, y2: 5 }
            : { x1: 4, y1: 6.5, x2: 20, y2: 6.5 }
        }
        transition={{ duration: 0.3, ease }}
      />
      {/* Barre du milieu → bras droit de la flèche */}
      <motion.line
        initial={false}
        animate={
          open
            ? { x1: 12, y1: 5, x2: 18, y2: 11 }
            : { x1: 4, y1: 12, x2: 20, y2: 12 }
        }
        transition={{ duration: 0.3, ease }}
      />
      {/* Barre du bas → tige de la flèche */}
      <motion.line
        initial={false}
        animate={
          open
            ? { x1: 12, y1: 5, x2: 12, y2: 19 }
            : { x1: 4, y1: 17.5, x2: 20, y2: 17.5 }
        }
        transition={{ duration: 0.3, ease }}
      />
    </svg>
  )
}
