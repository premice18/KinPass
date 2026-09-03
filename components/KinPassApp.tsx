'use client'

// ────────────────────────────────────────────────────────────────────────────
// Coquille applicative (SPA) kinPass.
//
// Navigation par état (le routing par URL arrivera plus tard). Chaque dossier
// `features/<domaine>` correspond à une future route.
//
// Auth (Phase 4.1) :
// - À l'ouverture, la coquille interroge `/api/auth/me` pour connaître
//   l'utilisateur connecté (cookie httpOnly illisible côté client).
// - Header : « Se connecter » si déconnecté ; nom + « Déconnexion » sinon.
// - `initialView='dashboard'` (posé après connexion) ouvre le dashboard si
//   l'utilisateur est un organisateur.
//
// Menu mobile : overlay + icône animée hamburger ⇄ flèche (voir §1.5).
// `MotionConfig reducedMotion="user"` respecte `prefers-reduced-motion`.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { CardWallet, Dashboard, LogOut, PlusCircle, Scanning, SecurityPass } from 'iconoir-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { AnimatedMenuIcon } from '@/components/ui/animated-menu-icon'
import { Logo } from '@/components/layout/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LandingPage } from '@/components/features/landing/LandingPage'
import { OrganizerDashboard } from '@/components/features/dashboard/OrganizerDashboard'
import { EventDetail } from '@/components/features/dashboard/EventDetail'
import { EventCreationForm } from '@/components/features/event-creation/EventCreationForm'
import { TicketCheckout } from '@/components/features/checkout/TicketCheckout'
import { Scanner } from '@/components/features/scanner/Scanner'
import { getEventById, type EditableEvent } from '@/lib/actions/events'

type View = 'home' | 'dashboard' | 'detail' | 'create' | 'checkout' | 'scanner'

// Utilisateur exposé au client (sans données sensibles).
export type SessionUser = {
  id: string
  email: string
  fullName: string
  role: string
}

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

interface KinPassAppProps {
  initialView?: View
}

export function KinPassApp({ initialView = 'home' }: KinPassAppProps) {
  const [view, setView] = useState<View>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  // Événement chargé pour le mode édition du formulaire (null = mode création).
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null)
  // Événement consulté dans la vue détail.
  const [viewedEventId, setViewedEventId] = useState<string | null>(null)
  // Session (chargée au montage via /api/auth/me).
  const [user, setUser] = useState<SessionUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Charge la session au premier rendu.
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: { user: SessionUser | null }) => {
        setUser(data.user)
        setAuthChecked(true)
        // Après connexion (?view=dashboard), ouvre le dashboard organisateur.
        if (data.user?.role === 'organizer' && initialView === 'dashboard') {
          setView('dashboard')
        }
      })
      .catch(() => setAuthChecked(true))
    // `initialView` ne sert qu'au premier rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ferme le menu et rend le focus au bouton d'ouverture (accessibilité).
  const closeMenu = () => {
    setMenuOpen(false)
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

  // Déconnexion (Auth.js) : efface la session puis revient à l'accueil.
  const handleLogout = async () => {
    await signOut({ redirect: false })
    setUser(null)
    setEditingEvent(null)
    navigate('home')
  }

  // Ouvre la vue détail d'un événement (KPIs + billets de CET événement).
  const openEventDetail = (eventId: string) => {
    setViewedEventId(eventId)
    setView('detail')
    setMenuOpen(false)
  }

  // Ouvre le formulaire en mode édition depuis la vue détail.
  const openEditFromDetail = (eventId: string) => {
    setEditingEvent(null)
    setViewedEventId(eventId)
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
  }, [menuOpen, closeMenu])

  const content =
    view === 'home' ? (
      <LandingPage onGetStarted={() => navigate('dashboard')} onCheckout={() => navigate('checkout')} />
    ) : view === 'dashboard' ? (
      <OrganizerDashboard
        onCreateEvent={openCreateEvent}
        onEditEvent={openEditEvent}
        onViewEvent={openEventDetail}
      />
    ) : view === 'detail' && viewedEventId ? (
      <EventDetail
        eventId={viewedEventId}
        onBack={() => navigate('dashboard')}
        onEdit={openEditFromDetail}
      />
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

            <div className="flex items-center gap-1.5">
              {/* Zone utilisateur : connexion / nom + déconnexion */}
              {authChecked &&
                (user ? (
                  <div className="hidden items-center gap-1.5 md:flex">
                    <span className="max-w-36 truncate text-sm text-muted-foreground">
                      {user.fullName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      aria-label="Se déconnecter"
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </Button>
                  </div>
                ) : (
                  <a
                    href="/auth/login"
                    className={buttonVariants({ variant: 'outline', size: 'sm', className: 'hidden md:inline-flex' })}
                  >
                    Se connecter
                  </a>
                ))}
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
                  {/* Lien connexion / déconnexion en pied de menu mobile */}
                  <motion.div variants={menuItemVariants} className="mt-1 border-t border-border pt-2">
                    {user ? (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion ({user.fullName})
                      </Button>
                    ) : (
                      <a
                        href="/auth/login"
                        className={buttonVariants({ variant: 'ghost', className: 'w-full justify-start' })}
                      >
                        Se connecter
                      </a>
                    )}
                  </motion.div>
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
