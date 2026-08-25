import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Pencil, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import AuthService from '@/services/authService'
import TripService, { type Trip } from '@/services/tripService'
import { ROUTES } from '@/config'

const formatTripDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

export default function MyTripsPage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = AuthService.getCurrentUser()
    if (!user?.id) {
      navigate(ROUTES.LOGIN)
      return
    }

    const loadTrips = async () => {
      setLoading(true)
      try {
        const fetchedTrips = await TripService.listTrips()
        setTrips(fetchedTrips)
      } catch (error) {
        console.error('Error loading trips:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadTrips()
  }, [navigate])

  return (
    <div className="min-h-screen bg-background pt-32 pb-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground">My Trips</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Save ideas, build a schedule, and turn separate services into one itinerary.
            </p>
          </div>
          <Link to={ROUTES.TRIP_PLANNER}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Trip
            </Button>
          </Link>
        </div>

        {trips.length === 0 ? (
          <Card className="p-10 text-center">
            <CalendarDays className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="font-serif text-2xl font-bold text-foreground">No trips yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Create your first trip, then add properties, tours, treks, cars, and restaurants while browsing.
            </p>
            <Link to={ROUTES.TRIP_PLANNER}>
              <Button className="mt-6">Create Trip</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {trips.map((trip) => (
              <Card key={trip.id} className="h-full p-6 transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">{trip.name}</h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {trip.destination}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
                      {trip.status}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/my-trips/${trip.id}?edit=1`)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatTripDate(trip.startDate)} - {formatTripDate(trip.endDate)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {trip.travelers} traveler{trip.travelers === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="ghost" onClick={() => navigate(`/my-trips/${trip.id}?summary=1`)}>
                    {trip.status === 'booked' ? 'View Summary' : 'View Trip'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
