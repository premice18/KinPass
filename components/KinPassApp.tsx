'use client'

import { useState } from 'react'
import { CardWallet, Dashboard, Menu, PlusCircle, Scanning, SecurityPass, X } from 'iconoir-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LandingPage } from '@/components/views/LandingPage'
import { OrganizerDashboard } from '@/components/views/OrganizerDashboard'
import { EventCreationForm } from '@/components/views/EventCreationForm'
import { TicketCheckout } from '@/components/views/TicketCheckout'
import { ScannerView } from '@/components/views/ScannerView'

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

  const navigate = (next: View) => {
    setView(next)
    setMenuOpen(false)
  }

  const content =
    view === 'home' ? (
      <LandingPage onGetStarted={() => navigate('dashboard')} onCheckout={() => navigate('checkout')} />
    ) : view === 'dashboard' ? (
      <OrganizerDashboard onCreateEvent={() => navigate('create')} />
    ) : view === 'create' ? (
      <EventCreationForm onEventCreated={() => navigate('dashboard')} />
    ) : view === 'checkout' ? (
      <TicketCheckout />
    ) : (
      <ScannerView />
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
