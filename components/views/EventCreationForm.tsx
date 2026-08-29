'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface FormData {
  title: string
  date: string
  time: string
  location: string
  price: string
  capacity: string
}

interface EventCreationFormProps {
  onEventCreated: () => void
}

export function EventCreationForm({ onEventCreated }: EventCreationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    date: '',
    time: '',
    location: '',
    price: '',
    capacity: '',
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Partial<FormData> = {}
    if (!formData.title) newErrors.title = 'Event title is required'
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.location) newErrors.location = 'Location is required'
    if (!formData.price) newErrors.price = 'Price is required'
    if (!formData.capacity) newErrors.capacity = 'Capacity is required'
    return newErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length === 0) {
      console.log('[v0] Event created:', formData)
      setFormData({ title: '', date: '', time: '', location: '', price: '', capacity: '' })
      onEventCreated()
    } else {
      setErrors(newErrors)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Event</CardTitle>
            <CardDescription>Set up your event details and ticket information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Event Title</label>
                <Input
                  name="title"
                  placeholder="Summer Music Festival"
                  value={formData.title}
                  onChange={handleChange}
                  className={errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Date</label>
                  <Input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={errors.date ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Time</label>
                  <Input
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Location</label>
                <Input
                  name="location"
                  placeholder="Central Park, New York"
                  value={formData.location}
                  onChange={handleChange}
                  className={errors.location ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Ticket Price ($)</label>
                  <Input
                    name="price"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    className={errors.price ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Capacity</label>
                  <Input
                    name="capacity"
                    type="number"
                    placeholder="500"
                    min="1"
                    value={formData.capacity}
                    onChange={handleChange}
                    className={errors.capacity ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {errors.capacity && <p className="text-xs text-destructive">{errors.capacity}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Create Event
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
