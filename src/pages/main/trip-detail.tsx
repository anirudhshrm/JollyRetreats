import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Car, CheckCircle2, Compass, Home, MapPin, Plus, Trash2, Utensils, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import TripService, { type Trip, type TripItem, type TripServiceType } from '@/services/tripService'
import { ROUTES } from '@/config'
import { tripDestinations } from '@/lib/trip-destinations'

const formatTripDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

const getTripDates = (trip: Pick<Trip, 'startDate' | 'endDate'>) => {
  const dates: string[] = []
  const current = new Date(`${trip.startDate}T00:00:00`)
  const end = new Date(`${trip.endDate}T00:00:00`)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

const getTripItemTotal = (item: Pick<TripItem, 'unitPrice' | 'quantity'>) =>
  Number(item.unitPrice || 0) * Math.max(1, Number(item.quantity || 1))

const serviceIcon: Record<TripServiceType, typeof Home> = {
  property: Home,
  tour: Compass,
  trek: Compass,
  restaurant: Utensils,
  car: Car
}

const browseRoute: Record<TripServiceType, string> = {
  property: ROUTES.PROPERTIES,
  tour: ROUTES.TOURS,
  trek: ROUTES.TREKS,
  restaurant: ROUTES.RESTAURANTS,
  car: ROUTES.CARS
}

export default function TripDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<TripItem[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDestination, setEditDestination] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editTravelers, setEditTravelers] = useState(1)
  const [editError, setEditError] = useState('')
  const [editHandled, setEditHandled] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const tripData = await TripService.getTrip(id)
      setTrip(tripData)
      if (tripData) {
        const itemsData = await TripService.listItems(id)
        setItems(itemsData)
      }
    } catch (error) {
      console.error('Error refreshing trip:', error)
    }
  }

  const groupedItems = useMemo(() => {
    if (!trip) return []
    return getTripDates(trip).map((date, index) => ({
      date,
      dayNumber: index + 1,
      items: items.filter((item) => item.scheduledDate === date)
    }))
  }, [items, trip])

  const total = items.reduce((sum, item) => sum + getTripItemTotal(item), 0)
  const isBooked = trip?.status === 'booked'
  const showSummary = isBooked || searchParams.get('summary') === '1'
  const serviceCounts = useMemo(() => {
    return items.reduce<Record<TripServiceType, number>>((counts, item) => {
      counts[item.serviceType as TripServiceType] += 1
      return counts
    }, { property: 0, tour: 0, trek: 0, restaurant: 0, car: 0 })
  }, [items])

  const removeItem = async (itemId: string) => {
    const success = await TripService.removeItem(id, itemId)
    if (success) {
      toast.success('Item removed from trip')
      await refresh()
    } else {
      toast.error('Failed to remove item')
    }
  }

  const deleteTrip = async () => {
    const success = await TripService.deleteTrip(id)
    if (success) {
      toast.success('Trip deleted')
      navigate(ROUTES.MY_TRIPS)
    } else {
      toast.error('Failed to delete trip')
    }
  }

  const bookTrip = async () => {
    if (items.length === 0) return
    const updated = await TripService.bookTrip(id)
    if (updated) {
      await refresh()
      toast.success('Trip booked successfully!')
      setStatusMessage('Trip booked successfully. Your itinerary is now marked as booked.')
    } else {
      toast.error('Failed to book trip')
    }
  }

  const openEdit = async () => {
    if (!trip) return
    if (trip.status === 'booked') {
      const updated = await TripService.reopenTrip(id)
      if (updated) {
        await refresh()
        toast.success('Trip reopened for editing')
        setStatusMessage('Trip reopened for editing. Review your itinerary before booking again.')
      }
    }
    setEditName(trip.name)
    setEditDestination(trip.destination)
    setEditStartDate(trip.startDate)
    setEditEndDate(trip.endDate)
    setEditTravelers(trip.travelers)
    setEditError('')
    setEditOpen(true)
  }

  const saveEdit = async () => {
    setEditError('')
    if (!editName.trim() || !editDestination.trim()) {
      setEditError('Trip name and destination are required.')
      return
    }
    if (new Date(`${editEndDate}T00:00:00`) < new Date(`${editStartDate}T00:00:00`)) {
      setEditError('End date must be after the start date.')
      return
    }

    const updated = await TripService.updateTrip(id, {
      name: editName.trim(),
      destination: editDestination.trim(),
      startDate: editStartDate,
      endDate: editEndDate,
      travelers: editTravelers
    })

    if (updated) {
      setEditOpen(false)
      await refresh()
      toast.success('Trip updated successfully')
      setStatusMessage('Trip details updated.')
    } else {
      toast.error('Failed to update trip')
    }
  }

  useEffect(() => {
    const user = AuthService.getCurrentUser()
    if (!user?.id) {
      navigate(ROUTES.LOGIN)
      return
    }

    const loadTrip = async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    }

    void loadTrip()
  }, [id, navigate])

  useEffect(() => {
    if (!trip || editHandled || searchParams.get('edit') !== '1') return
    setEditHandled(true)
    void openEdit()
  }, [editHandled, searchParams, trip])

  if (!trip) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground">Trip not found</h1>
          <Link to={ROUTES.MY_TRIPS}>
            <Button className="mt-6">Back to My Trips</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-12">
      <div className="mx-auto max-w-6xl px-6">
        <Button variant="ghost" className="mb-6 pl-0" onClick={() => navigate(ROUTES.MY_TRIPS)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Trips
        </Button>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <Badge className="mb-3 capitalize">{trip.status}</Badge>
            <h1 className="font-serif text-4xl font-bold text-foreground">{trip.name}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{trip.destination}</span>
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatTripDate(trip.startDate)} - {formatTripDate(trip.endDate)}</span>
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{trip.travelers} traveler{trip.travelers === 1 ? '' : 's'}</span>
            </div>
          </div>

          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Estimated total</p>
            <p className="mt-1 font-serif text-3xl font-bold text-foreground">${total.toFixed(2)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{items.length} planned item{items.length === 1 ? '' : 's'}</p>
            <Button
              className="mt-4 w-full"
              disabled={items.length === 0 || isBooked}
              onClick={bookTrip}
            >
              {isBooked ? 'Trip Booked' : 'Book Full Trip'}
            </Button>
            <Button className="mt-2 w-full" variant="outline" onClick={deleteTrip}>Delete Trip</Button>
            {statusMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>{statusMessage}</p>
              </div>
            )}
          </Card>
        </div>

        {showSummary ? (
          <Card className="p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground">
                  {isBooked ? 'Booked Trip Summary' : 'Trip Summary'}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {isBooked
                    ? 'This trip is booked, so only the summary is shown here. Use edit from My Trips to reopen it.'
                    : 'This is a summary of your planned trip. Use edit from My Trips to change the itinerary.'}
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary">{isBooked ? 'Booked' : 'Planning'}</Badge>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="mt-1 font-serif text-2xl font-bold text-foreground">${total.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Dates</p>
                <p className="mt-1 font-medium text-foreground">{formatTripDate(trip.startDate)} - {formatTripDate(trip.endDate)}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Travelers</p>
                <p className="mt-1 font-medium text-foreground">{trip.travelers}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Booked items</p>
                <p className="mt-1 font-medium text-foreground">{items.length}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {(Object.keys(serviceCounts) as TripServiceType[])
                .filter((type) => serviceCounts[type] > 0)
                .map((type) => (
                  <Badge key={type} variant="outline" className="capitalize">
                    {type}: {serviceCounts[type]}
                  </Badge>
                ))}
            </div>
          </Card>
        ) : (
          <>
            <Card className="mb-8 p-5">
              <h2 className="font-semibold text-foreground">Add more to this trip</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(Object.keys(browseRoute) as TripServiceType[]).map((type) => (
                  <Link key={type} to={browseRoute[type]}>
                    <Button variant="outline" size="sm" className="capitalize">
                      <Plus className="mr-2 h-4 w-4" />
                      {type}
                    </Button>
                  </Link>
                ))}
              </div>
            </Card>

            <div className="space-y-6">
          {groupedItems.map((group) => (
            <Card key={group.date} className="p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-primary">Day {group.dayNumber}</p>
                  <h2 className="font-serif text-2xl font-bold text-foreground">{formatTripDate(group.date)}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{group.items.length} item{group.items.length === 1 ? '' : 's'}</p>
              </div>

              {group.items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No plans yet for this day.
                </p>
              ) : (
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const Icon = serviceIcon[item.serviceType]
                    return (
                      <div key={item.id} className="flex gap-4 rounded-lg border border-border p-4">
                        {item.image ? (
                          <img src={item.image} alt={item.serviceName} className="h-20 w-24 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-20 w-24 items-center justify-center rounded-md bg-muted">
                            <Icon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.scheduledTime} · {item.serviceType}</p>
                              <h3 className="mt-1 font-semibold text-foreground">{item.serviceName}</h3>
                              {item.location && <p className="mt-1 text-sm text-muted-foreground">{item.location}</p>}
                              {item.notes && <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>}
                            </div>
                            <Button variant="ghost" size="icon" aria-label="Remove item" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">
                            Qty {item.quantity} · ${item.unitPrice} {item.priceLabel} · ${getTripItemTotal(item).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              Update trip details. Booked trips are reopened for editing when you save changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-trip-name">Trip name</Label>
              <Input id="edit-trip-name" value={editName} onChange={(event) => setEditName(event.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="edit-destination">Destination</Label>
              <select
                id="edit-destination"
                value={editDestination}
                onChange={(event) => setEditDestination(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {!tripDestinations.includes(editDestination) && editDestination && (
                  <option value={editDestination} disabled>{editDestination}</option>
                )}
                {tripDestinations.map((destination) => (
                  <option key={destination} value={destination}>{destination}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-start-date">Start date</Label>
                <Input id="edit-start-date" type="date" value={editStartDate} onChange={(event) => setEditStartDate(event.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="edit-end-date">End date</Label>
                <Input id="edit-end-date" type="date" value={editEndDate} onChange={(event) => setEditEndDate(event.target.value)} className="mt-2" />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-travelers">Travelers</Label>
              <Input
                id="edit-travelers"
                type="number"
                min={1}
                value={editTravelers}
                onChange={(event) => setEditTravelers(Math.max(1, Number(event.target.value) || 1))}
                className="mt-2"
              />
            </div>
            {editError && <p className="text-sm text-red-500">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
