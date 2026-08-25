import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import AuthService from '@/services/authService'
import TripService, { type Trip, type TripServiceType } from '@/services/tripService'
import { ROUTES } from '@/config'
import { getTripDates } from '@/lib/trip-planner'

interface AddToTripButtonProps {
  service: {
    serviceType: TripServiceType
    serviceId: string
    serviceName: string
    location: string
    image?: string
    unitPrice: number
    priceLabel: string
    defaultQuantity?: number
  }
  disabled?: boolean
}

export function AddToTripButton({ service, disabled }: AddToTripButtonProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripId, setTripId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('10:00')
  const [quantity, setQuantity] = useState(service.defaultQuantity || 1)
  const [notes, setNotes] = useState('')
  const [loadingTrips, setLoadingTrips] = useState(false)
  const [adding, setAdding] = useState(false)

  const selectedTrip = useMemo(() => trips.find((trip) => trip.id === tripId) || null, [tripId, trips])
  const tripDates = useMemo(() => selectedTrip ? getTripDates(selectedTrip) : [], [selectedTrip])

  useEffect(() => {
    if (!open) return

    const loadTrips = async () => {
      setLoadingTrips(true)
      const userTrips = await TripService.listTrips()
      setTrips(userTrips)
      setTripId(userTrips[0]?.id || '')
      setScheduledDate(userTrips[0]?.startDate || '')
      setLoadingTrips(false)
    }

    void loadTrips()
  }, [open])

  useEffect(() => {
    if (!selectedTrip) return
    setScheduledDate((current) => current || selectedTrip.startDate)
  }, [selectedTrip])

  const handleOpen = () => {
    if (!AuthService.isAuthenticated()) {
      navigate(ROUTES.LOGIN)
      return
    }
    setOpen(true)
  }

  const handleAdd = async () => {
    if (!tripId || !scheduledDate || adding) return
    setAdding(true)
    const item = await TripService.addItem({
      tripId,
      serviceType: service.serviceType,
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      location: service.location,
      image: service.image,
      scheduledDate,
      scheduledTime,
      quantity,
      unitPrice: service.unitPrice,
      priceLabel: service.priceLabel,
      notes
    })
    setAdding(false)

    if (item) {
      setOpen(false)
      toast.success(`${service.serviceName} added to your trip.`)
      navigate(`/my-trips/${tripId}`)
    } else {
      toast.error('Failed to add item to trip. Please try again.')
    }
  }

  return (
    <>
      <Button type="button" variant="outline" disabled={disabled} onClick={handleOpen}>
        <CalendarPlus className="mr-2 h-4 w-4" />
        Add to Trip
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Trip</DialogTitle>
            <DialogDescription>
              Place {service.serviceName} into one of your saved itineraries.
            </DialogDescription>
          </DialogHeader>

          {loadingTrips ? (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Loading your trips...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Create a trip first, then come back to add this service.</p>
              <Link to={ROUTES.TRIP_PLANNER}>
                <Button className="mt-4">Create Trip</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="trip">Trip</Label>
                <select
                  id="trip"
                  value={tripId}
                  onChange={(event) => {
                    const nextTrip = trips.find((trip) => trip.id === event.target.value)
                    setTripId(event.target.value)
                    setScheduledDate(nextTrip?.startDate || '')
                  }}
                  className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>{trip.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="trip-date">Date</Label>
                  <select
                    id="trip-date"
                    value={scheduledDate}
                    onChange={(event) => setScheduledDate(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {tripDates.map((date) => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="trip-time">Time</Label>
                  <Input id="trip-time" type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className="mt-2" />
                </div>
              </div>

              <div>
                <Label htmlFor="trip-quantity">Quantity</Label>
                <Input
                  id="trip-quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="trip-notes">Notes</Label>
                <Input id="trip-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional pickup, seating, or timing notes" className="mt-2" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={loadingTrips || adding || trips.length === 0 || !tripId || !scheduledDate}>
              {adding ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
