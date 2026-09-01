'use client'

// ────────────────────────────────────────────────────────────────────────────
// Utilitaires d'animation (Framer Motion).
//
// `FadeIn` : apparition douce au scroll (opacité + translation Y) quand
// l'élément entre dans le viewport. Respecte `prefers-reduced-motion` :
// si l'utilisateur demande moins de mouvement, l'animation est désactivée
// (les éléments sont simplement visibles).
//
// `MotionCard` : carte avec un léger effet de survol (translation Y + ombre),
// désactivé également en reduced-motion.
// ────────────────────────────────────────────────────────────────────────────

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { PropsWithChildren } from 'react'

// Variantes partagées : montée + fondu.
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: PropsWithChildren<{ className?: string; delay?: number }>) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={reduceMotion ? undefined : fadeUp}
      transition={reduceMotion ? undefined : { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Carte animée au survol (hover) : élévation légère + ombre accentuée.
export function MotionCard({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
    >
      {children}
    </motion.div>
  )
}
