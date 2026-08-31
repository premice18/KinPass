'use client'

// ────────────────────────────────────────────────────────────────────────────
// Coquille applicative (SPA) Kin Pass.
//
// À ce stade du projet, la navigation est gérée par état (pas encore de
// routing App Router par URL — cf. Phase 6). Les vues sont donc regroupées
// par domaine dans `components/features/*` et montées/démontées ici selon la
// vue active. Chaque dossier `features/<domaine>` correspond à une future
// route de l'application (landing → `/`, dashboard → `/dashboard`, etc.).
// ────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { CardWallet, Dashboard, Menu, PlusCircle, Scanning, SecurityPass, X } from 'iconoir-react'
import { Button } from '@/components/ui/button'
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

export function KinPassApp() {
  const [view, setView] = useState<View>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  // Événement chargé pour le mode édition du formulaire (null = mode création).
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null)

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <button
            className="flex items-center gap-2 text-left font-semibold tracking-tight"
            onClick={() => navigate('home')}
          >
            <Logo className="h-8 w-8 shrink-0" />
            Kin Pass
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
            <Button
              className="md:hidden"
              variant="ghost"
              size="icon"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <nav aria-label="Navigation mobile" className="border-t border-border/80 bg-background md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-8">
              {nav.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={view === id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => navigate(id)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </nav>
        )}
      </header>

      {content}
    </div>
  )
}
