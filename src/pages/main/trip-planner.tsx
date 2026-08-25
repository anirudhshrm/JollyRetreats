import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthService from '@/services/authService'
import TripService from '@/services/tripService'
import { ROUTES } from '@/config'
import { tripDestinations } from '@/lib/trip-destinations'

const getDateOffset = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export default function TripPlannerPage() {
  const navigate = useNavigate()
  const user = AuthService.getCurrentUser()
  const [name, setName] = useState('My Next Retreat')
  const [destination, setDestination] = useState(tripDestinations[0] || '')
  const [startDate, setStartDate] = useState(getDateOffset(14))
  const [endDate, setEndDate] = useState(getDateOffset(17))
  const [travelers, setTravelers] = useState(2)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!user?.id) {
      navigate(ROUTES.LOGIN)
      return
    }
    if (!name.trim() || !destination.trim()) {
      setError('Trip name and destination are required.')
      return
    }
    if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
      setError('End date must be after the start date.')
      return
    }

    setLoading(true)
    try {
      const trip = await TripService.createTrip({
        name: name.trim(),
        destination: destination.trim(),
        startDate,
        endDate,
        travelers
      })

      if (trip) {
        toast.success('Trip created successfully')
        navigate(`/my-trips/${trip.id}`)
      } else {
        setError('Failed to create trip. Please try again.')
      }
    } catch (err) {
      setError('An error occurred while creating the trip.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground">Plan a Trip</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Create the trip shell first. Then add stays, tours, treks, restaurants, and cars from their detail pages.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="trip-name">Trip name</Label>
                <Input id="trip-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2" />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="destination">Destination</Label>
                <div className="relative mt-2">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select
                    id="destination"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-9 text-sm"
                  >
                    {tripDestinations.map((destination) => (
                      <option key={destination} value={destination}>{destination}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="start-date">Start date</Label>
                <div className="relative mt-2">
                  <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="pl-9" />
                </div>
              </div>

              <div>
                <Label htmlFor="end-date">End date</Label>
                <div className="relative mt-2">
                  <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="pl-9" />
                </div>
              </div>

              <div>
                <Label htmlFor="travelers">Travelers</Label>
                <div className="relative mt-2">
                  <Users className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="travelers" type="number" min={1} value={travelers} onChange={(event) => setTravelers(Math.max(1, Number(event.target.value) || 1))} className="pl-9" />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Trip'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(ROUTES.MY_TRIPS)}>
                View My Trips
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
