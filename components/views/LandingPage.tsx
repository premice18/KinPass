'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket, QrCode, Lock, BarChart3 } from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Secure event ticketing</span>
          </div>
          <h1 className="mb-4 text-5xl font-bold leading-tight text-foreground sm:text-6xl">
            Ticketing reimagined<br />for independent events
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Secure event ticketing and real-time access control. QR codes, alphanumeric codes, and instant verification at the door.
          </p>
          <Button onClick={onGetStarted} size="lg" className="px-8 py-6 text-base">
            Get Started
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <QrCode className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">QR Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Instant ticket validation with QR code scanning at entry points</CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <Lock className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">Secure Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Alphanumeric codes for manual entry and backup verification</CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <BarChart3 className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">Real-time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Live dashboard showing ticket sales and attendance metrics</CardDescription>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <Ticket className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">Easy Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Create events and manage tickets from a simple, intuitive interface</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
