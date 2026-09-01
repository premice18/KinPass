'use client'

// ────────────────────────────────────────────────────────────────────────────
// Coquille applicative (SPA) kinPass.
//
// À ce stade du projet, la navigation est gérée par état (pas encore de
// routing App Router par URL — cf. Phase 6). Les vues sont donc regroupées
// par domaine dans `components/features/*` et montées/démontées ici selon la
// vue active. Chaque dossier `features/<domaine>` correspond à une future
// route de l'application (landing → `/`, dashboard → `/dashboard`, etc.).
//
// Menu mobile (overlay) :
// - Le menu se SUPERPOSE au contenu (position fixe, panneau glissant depuis
//   le haut + backdrop flouté) : la page ne bouge pas.
// - Fermeture par : clic sur le backdrop, touche Échap, ou choix d'un lien.
// - Icône animée hamburger ⇄ flèche vers le haut (`AnimatedMenuIcon`),
//   volontairement différente d'une croix type « X ».
// - `MotionConfig reducedMotion="user"` respecte `prefers-reduced-motion`.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { CardWallet, Dashboard, PlusCircle, Scanning, SecurityPass } from 'iconoir-react'
import { Button } from '@/components/ui/button'
import { AnimatedMenuIcon } from '@/components/ui/animated-menu-icon'
import { Logo } from '@/components/layout/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LandingPage } from '@/components/features/landing/LandingPage'
import { OrganizerDashboard } from '@/components/features/dashboard/OrganizerDashboard'
import { EventCreationForm } from '@/components/features/event-creation/EventCreationForm'
import { TicketCheckout } from '@/components/features/checkout/TicketCheckout'
import { Scanner } from '@/components/features/scanner/Scanner'
import { getEventById, type EditableEvent } from '@/lib/actions/events'

type View = 'home' | 'dashboard' | 'create' | 'checkout' | 'scanner'

const nav = [
  { id: 'home', label: 'Accueil', icon: SecurityPass },
  { id: 'dashboard', label: 'Tableau de bord', icon: Dashboard },
  { id: 'create', label: 'Créer', icon: PlusCircle },
  { id: 'checkout', label: 'Billetterie', icon: CardWallet },
  { id: 'scanner', label: 'Scanner', icon: Scanning },
] as const

// Variantes d'apparition en cascade des entrées du menu mobile.
const menuItemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0 },
}

export function KinPassApp() {
  const [view, setView] = useState<View>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  // Événement chargé pour le mode édition du formulaire (null = mode création).
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null)

  // Ferme le menu et rend le focus au bouton d'ouverture (accessibilité).
  const closeMenu = () => {
    setMenuOpen(false)
    // Le bouton porte un id stable ; on y rend le focus après fermeture.
    document.getElementById('menu-toggle')?.focus()
  }

  const navigate = (next: View) => {
    setView(next)
    setMenuOpen(false)
  }

  // Ouvre le formulaire en mode création (réinitialise l'édition en cours).
  const openCreateEvent = () => {
    setEditingEvent(null)
    navigate('create')
  }

  // Ouvre le formulaire en mode édition : charge l'événement en base via la
  // Server Action, puis navigue vers la vue formulaire pré-remplie.
  const openEditEvent = async (eventId: string) => {
    const result = await getEventById(eventId)
    if (!result.success) {
      // MVP : alerte native faute d'état d'erreur global dans l'app.
      alert(result.error)
      return
    }
    setEditingEvent(result.data)
    navigate('create')
  }

  // Pendant que le menu est ouvert : touche Échap pour fermer + blocage du
  // scroll de la page (l'overlay est en position fixe par-dessus le contenu).
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen])

  const content =
    view === 'home' ? (
      <LandingPage onGetStarted={() => navigate('dashboard')} onCheckout={() => navigate('checkout')} />
    ) : view === 'dashboard' ? (
      <OrganizerDashboard onCreateEvent={openCreateEvent} onEditEvent={openEditEvent} />
    ) : view === 'create' ? (
      <EventCreationForm
        initialData={editingEvent ?? undefined}
        onNavigateBack={() => navigate('dashboard')}
      />
    ) : view === 'checkout' ? (
      <TicketCheckout />
    ) : (
      <Scanner />
    )

  return (
    // Respecte `prefers-reduced-motion` pour toutes les animations de l'app.
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen">
        {/* Header : au-dessus de l'overlay (z-50) pour garder le bouton visible */}
        <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
            <button
              className="flex items-center gap-2 text-left font-semibold tracking-tight"
              onClick={() => navigate('home')}
            >
              <Logo className="h-8 w-8 shrink-0" />
              kinPass
            </button>

            <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
              {nav.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={view === id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(id)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <ThemeToggle />
              {/* Bouton du menu mobile : icône animée hamburger ⇄ flèche */}
              <Button
                id="menu-toggle"
                className="md:hidden"
                variant="ghost"
                size="icon"
                aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
              >
                <AnimatedMenuIcon open={menuOpen} className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/*
          Overlay mobile : recouvre la page SANS la décaler.
          - Backdrop semi-transparent flouté : clic = fermeture.
          - Panneau glissant depuis le haut (sous le header), entrées en cascade.
        */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div key="mobile-menu-overlay" className="fixed inset-0 z-40 md:hidden">
              {/* Backdrop (invisible au clavier, cliquable pour fermer) */}
              <motion.button
                aria-label="Fermer le menu"
                tabIndex={-1}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeMenu}
                className="absolute inset-0 h-full w-full cursor-default bg-background/60 backdrop-blur-sm"
              />
              {/* Panneau supérieur (glisse depuis le haut) */}
              <motion.nav
                id="mobile-menu"
                aria-label="Navigation mobile"
                initial={{ y: '-120%' }}
                animate={{ y: 0 }}
                exit={{ y: '-120%' }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-x-0 top-14 border-b border-border bg-background px-4 pb-4 pt-2 shadow-lg shadow-black/5 sm:px-8"
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.045 } } }}
                  className="flex flex-col gap-1"
                >
                  {nav.map(({ id, label, icon: Icon }) => (
                    <motion.div key={id} variants={menuItemVariants}>
                      <Button
                        variant={view === id ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => navigate(id)}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>

        {content}
      </div>
    </MotionConfig>
  )
}
