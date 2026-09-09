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
// - Header : « Se connecter » si déconnecté ; avatar + nom + menu (Mon
//   profil / Déconnexion) si connecté.
// - `initialView='dashboard'` (posé après connexion) ouvre le dashboard si
//   l'utilisateur est un organisateur.
//
// Menu mobile : overlay + icône animée hamburger ⇄ flèche (voir §1.5).
// `MotionConfig reducedMotion="user"` respecte `prefers-reduced-motion`.
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { CardWallet, Dashboard, LogOut, PlusCircle, Scanning, SecurityPass, Settings } from 'iconoir-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { AnimatedMenuIcon } from '@/components/ui/animated-menu-icon'
import { Logo } from '@/components/layout/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LandingPage } from '@/components/features/landing/LandingPage'
import { OrganizerIntro } from '@/components/features/landing/OrganizerIntro'
import { OrganizerDashboard } from '@/components/features/dashboard/OrganizerDashboard'
import { EventDetail } from '@/components/features/dashboard/EventDetail'
import { EventCreationForm } from '@/components/features/event-creation/EventCreationForm'
import { ProfileSettings } from '@/components/features/settings/ProfileSettings'
import { TeamScanners } from '@/components/features/settings/TeamScanners'
import { EventCheckout } from '@/components/features/checkout/EventCheckout'
import { ScannerIntro } from '@/components/features/scanner/ScannerIntro'
import { ScanDashboard } from '@/components/features/scanner/ScanDashboard'
import { EventPublicView } from '@/components/features/event-public/EventPublicView'
import { EventListing } from '@/components/features/events/EventListing'
import { getEventById, type EditableEvent, type PublicEvent } from '@/lib/actions/events'

type View =
  | 'home'
  | 'dashboard'
  | 'detail'
  | 'create'
  | 'settings'
  | 'team'
  | 'event'
  | 'event-checkout'
  | 'events'
  | 'organizer-intro'
  | 'scanner-intro'
  | 'scan-dashboard'

// Utilisateur exposé au client (sans données sensibles).
export type SessionUser = {
  id: string
  email: string
  fullName: string
  role: string
  avatarUrl?: string | null
}

// Initiales du nom (avatar de repli).
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const nav = [
  { id: 'home', label: 'Accueil', icon: SecurityPass },
  { id: 'dashboard', label: 'Tableau de bord', icon: Dashboard },
  { id: 'create', label: 'Créer', icon: PlusCircle },
  // Rubrique « Billetterie » : vitrine des événements publiés (Phase 9.3) —
  // remplace le checkout maquette, désormais atteint via le CTA d'une page
  // publique /e/[slug] (en attendant le vrai checkout, Phase 6.2).
  { id: 'events', label: 'Billetterie', icon: CardWallet },
  { id: 'scanner', label: 'Scanner', icon: Scanning },
] as const

// Variantes d'apparition en cascade des entrées du menu mobile.
const menuItemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0 },
}

interface KinPassAppProps {
  initialView?: View
  // Page publique d'un événement (`/e/[slug]`) : données injectées depuis le
  // serveur (route `app/e/[slug]/page.tsx`, Phase 6.1) — aucun appel client.
  initialEvent?: PublicEvent
}

export function KinPassApp({ initialView = 'home', initialEvent }: KinPassAppProps) {
  // Vue initiale immédiate (sans attendre le fetch de session) : page publique
  // d'un événement (ou son tunnel d'achat) dès le rendu serveur — le HTML
  // livré contient le contenu (SEO, première impression).
  const [view, setView] = useState<View>(
    initialView === 'event' || initialView === 'event-checkout'
      ? initialEvent
        ? initialView
        : 'home'
      : 'home',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  // Événement chargé pour le mode édition du formulaire (null = mode création).
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null)
  // Événement consulté dans la vue détail.
  const [viewedEventId, setViewedEventId] = useState<string | null>(null)
  // Événement public affiché dans la vue « event » (route /e/[slug]).
  const [publicEvent, setPublicEvent] = useState<PublicEvent | null>(initialEvent ?? null)
  // Session (chargée au montage via /api/auth/me).
  const [user, setUser] = useState<SessionUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Menu adapté au rôle (Phase 7.2) : un agent ne voit jamais les entrées
  // organisateur — son espace de travail est la route réelle /scan.
  const visibleNav =
    user?.role === 'agent'
      ? nav.filter((item) => item.id === 'home' || item.id === 'events')
      : nav

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
        // Pages publiques d'un événement (/e/[slug], /e/[slug]/checkout) :
        // ouvertes pour tous (connecté ou non), données déjà côté serveur.
        if ((initialView === 'event' || initialView === 'event-checkout') && initialEvent) {
          setView(initialView)
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

  // CTA « Créer un événement » (landing) : un organisateur connecté rejoint
  // directement son tableau de bord ; sinon, on présente d'abord la valeur
  // (inscription organisateur ~30 s) avant d'envoyer vers /auth/register.
  const handleGetStarted = () => {
    if (user?.role === 'organizer') {
      navigate('dashboard')
    } else {
      navigate('organizer-intro')
    }
  }

  // Navigation du MENU, adaptée au rôle :
  //  - « Tableau de bord » et « Créer » : l'organisateur accède à son espace ;
  //    un visiteur atterrit sur la page d'explication (inscription ~30 s) ;
  //  - « Scanner » : l'ORGANISATEUR supervise ses entrées en direct (dashboard
  //    scan) ; les autres sont aiguillés vers l'explication du contrôle
  //    d'accès (agents, Phase 7).
  const handleNav = (id: (typeof nav)[number]['id']) => {
    const isOrganizer = user?.role === 'organizer'
    if (id === 'dashboard') {
      navigate(isOrganizer ? 'dashboard' : 'organizer-intro')
    } else if (id === 'create') {
      navigate(isOrganizer ? 'create' : 'organizer-intro')
    } else if (id === 'scanner') {
      navigate(isOrganizer ? 'scan-dashboard' : 'scanner-intro')
    } else {
      navigate(id)
    }
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

  // Recharge la session (après modification du profil, ex. avatar).
  const refreshSession = useCallback(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: { user: SessionUser | null }) => setUser(data.user))
      .catch(() => undefined)
  }, [])

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
      <LandingPage
        onGetStarted={handleGetStarted}
        onBrowse={() => navigate('events')}
      />
    ) : view === 'organizer-intro' ? (
      /* Page de valeur « Pour les organisateurs » : atterrissage du CTA
         « Créer un événement » pour un visiteur NON connecté — présente
         l'inscription (30 s) puis aiguille vers /auth/register. */
      <OrganizerIntro />
    ) : view === 'event' && publicEvent ? (
      /* Page publique d'un événement (Phase 6.1). */
      <EventPublicView event={publicEvent} />
    ) : view === 'event-checkout' && publicEvent ? (
      /* Tunnel d'achat réel (Phase 6.2) — route /e/[slug]/checkout. */
      <EventCheckout event={publicEvent} />
    ) : view === 'events' ? (
      /* Vitrine « Billetterie » (Phase 9.3) : l'organisateur connecté dispose
         du CTA « Créer un événement » dans l'état vide. */
      <EventListing onCreateEvent={user?.role === 'organizer' ? openCreateEvent : undefined} />
    ) : view === 'dashboard' ? (
      <OrganizerDashboard
        onCreateEvent={openCreateEvent}
        onEditEvent={openEditEvent}
        onViewEvent={openEventDetail}
        onOpenTeam={() => navigate('team')}
      />
    ) : view === 'team' ? (
      /* Équipe / Scanneurs (Phase 7.1) : comptes agents + assignations. */
      <TeamScanners onBack={() => navigate('dashboard')} />
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
    ) : view === 'settings' ? (
      <ProfileSettings onBack={() => navigate('dashboard')} onProfileUpdated={refreshSession} />
    ) : view === 'scanner-intro' ? (
      /* Page d'explication « Contrôle d'accès » (agents, Phase 7). */
      <ScannerIntro />
    ) : view === 'scan-dashboard' ? (
      /* Dashboard « Entrées en direct » de l'organisateur. */
      <ScanDashboard onBack={() => navigate('dashboard')} onOpenTeam={() => navigate('team')} />
    ) : null

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
              {visibleNav.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={view === id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleNav(id)}
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
                    {/* Avatar (photo Google/URL ou initiales) + lien profil —
                        masqué pour un agent (son espace est /scan). */}
                    {user?.role !== 'agent' && (
                      <button
                        onClick={() => navigate('settings')}
                        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm transition-colors hover:bg-muted"
                        aria-label="Mon profil"
                      >
                        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-bold">
                          {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initialsOf(user.fullName)
                          )}
                        </span>
                        <span className="max-w-32 truncate text-foreground">{user.fullName}</span>
                      </button>
                    )}
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
                  {visibleNav.map(({ id, label, icon: Icon }) => (
                    <motion.div key={id} variants={menuItemVariants}>
                      <Button
                        variant={view === id ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => handleNav(id)}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    </motion.div>
                  ))}
                  {/* Pied de menu mobile : avatar + profil / connexion */}
                  <motion.div variants={menuItemVariants} className="mt-1 border-t border-border pt-2">
                    {user ? (
                      <>
                        <div className="mb-1 flex items-center gap-2 px-2 py-1">
                          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-bold">
                            {user.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              initialsOf(user.fullName)
                            )}
                          </span>
                          <span className="min-w-0 truncate text-sm">{user.fullName}</span>
                        </div>
                        {/* « Mon profil » : réservé à l'organisateur (un agent
                            travaille sur /scan et n'a pas de réglages ici). */}
                        {user.role !== 'agent' && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => navigate('settings')}
                          >
                            <Settings className="h-4 w-4" />
                            Mon profil
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </Button>
                      </>
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


