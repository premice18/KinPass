'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, Ticket, Users, Calendar, MapPin, ArrowRight } from 'lucide-react'

interface Event {
  id: string
  name: string
  date: string
  location: string
  ticketsTotal: number
  ticketsSold: number
  status: 'upcoming' | 'active' | 'completed' | 'sold-out'
}

interface DashboardProps {
  onCreateEvent: () => void
}

export function OrganizerDashboard({ onCreateEvent }: DashboardProps) {
  const mockMetrics = { ticketsSold: 1247, revenue: '$18,705', scannedTickets: 892 }
  
  const mockEvents: Event[] = [
    { id: '1', name: 'Summer Music Festival', date: 'Aug 15, 2024', location: 'Central Park', ticketsTotal: 500, ticketsSold: 487, status: 'active' },
    { id: '2', name: 'Tech Conference 2024', date: 'Sep 3, 2024', location: 'Downtown Convention', ticketsTotal: 300, ticketsSold: 298, status: 'sold-out' },
    { id: '3', name: 'Art Exhibition Opening', date: 'Sep 20, 2024', location: 'Modern Art Gallery', ticketsTotal: 200, ticketsSold: 45, status: 'upcoming' },
  ]

  const getStatusColor = (status: Event['status']) => {
    const statusMap = { upcoming: 'default' as const, active: 'success' as const, 'sold-out': 'warning' as const, completed: 'secondary' as const }
    return statusMap[status]
  }

  const getStatusLabel = (status: Event['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage your events and ticket sales</p>
          </div>
          <Button onClick={onCreateEvent} size="lg">
            Create Event
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tickets Sold</CardTitle>
                <Ticket className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockMetrics.ticketsSold.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockMetrics.revenue}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scanned</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockMetrics.scannedTickets.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">Recent Events</h2>
          <div className="space-y-3">
            {mockEvents.map((event) => (
              <Card key={event.id} className="transition-all hover:border-primary/50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-start gap-2 sm:items-center">
                        <h3 className="text-lg font-semibold text-foreground">{event.name}</h3>
                        <Badge variant={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {event.ticketsSold}/{event.ticketsTotal} sold
                        </div>
                        <div className="mt-1 h-2 w-24 rounded-full bg-muted sm:w-32">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${(event.ticketsSold / event.ticketsTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
