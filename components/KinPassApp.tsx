'use client'

import { useState } from 'react'
import { LayoutDashboard, PlusCircle, ScanLine, Ticket, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingPage } from '@/components/views/LandingPage'
import { OrganizerDashboard } from '@/components/views/OrganizerDashboard'
import { EventCreationForm } from '@/components/views/EventCreationForm'
import { TicketCheckout } from '@/components/views/TicketCheckout'
import { ScannerView } from '@/components/views/ScannerView'

type View = 'home' | 'dashboard' | 'create' | 'checkout' | 'scanner'
const nav = [{ id: 'home', label: 'Home', icon: Ticket }, { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'create', label: 'Create event', icon: PlusCircle }, { id: 'checkout', label: 'Checkout', icon: WalletCards }, { id: 'scanner', label: 'Scanner', icon: ScanLine }] as const

export function KinPassApp() {
  const [view, setView] = useState<View>('home')
  const content = view === 'home' ? <LandingPage onGetStarted={() => setView('dashboard')} /> : view === 'dashboard' ? <OrganizerDashboard onCreateEvent={() => setView('create')} /> : view === 'create' ? <EventCreationForm onEventCreated={() => setView('dashboard')} /> : view === 'checkout' ? <TicketCheckout /> : <ScannerView />
  return <div className="min-h-screen"><header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8"><button className="flex items-center gap-2 text-left font-semibold tracking-tight" onClick={() => setView('home')}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Ticket className="h-4 w-4" /></span>Kin Pass</button><nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">{nav.map(({ id, label, icon: Icon }) => <Button key={id} variant={view === id ? 'secondary' : 'ghost'} size="sm" onClick={() => setView(id)}><Icon className="h-4 w-4" />{label}</Button>)}</nav><Button className="md:hidden" size="sm" onClick={() => setView('dashboard')}>Open app</Button></div></header>{content}</div>
}
