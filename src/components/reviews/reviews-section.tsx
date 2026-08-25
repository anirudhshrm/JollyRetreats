import { useEffect, useState, type FormEvent } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import AuthService from '@/services/authService'
import { reviewsApi, type Review, type ReviewsSummary } from '@/services/reviewsApi'
import type { SupportedServiceType } from '@/services/bookingApi'

interface ReviewsSectionProps {
  serviceType: SupportedServiceType
  serviceId: number
}

const emptySummary = { averageRating: 0, count: 0 }

export function ReviewsSection({ serviceType, serviceId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewsSummary>(emptySummary)
  const [eligible, setEligible] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!serviceId) return
    setLoading(true)
    setMessage('')
    try {
      const data = await reviewsApi.list(serviceType, serviceId)
      setReviews(data.reviews)
      setSummary(data.summary)

      const token = AuthService.getToken()
      if (token && AuthService.getUserRole() === 'user') {
        const mine = await reviewsApi.me(token, serviceType, serviceId)
        setEligible(mine.eligible)
        if (mine.review) {
          setRating(Number(mine.review.rating))
          setComment(mine.review.comment)
        }
      } else {
        setEligible(false)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [serviceType, serviceId])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const token = AuthService.getToken()
    if (!token) {
      setMessage('Please log in to review this service.')
      return
    }
    try {
      const data = await reviewsApi.submit(token, {
        serviceType,
        serviceId,
        rating,
        comment
      })
      setReviews(data.reviews)
      setSummary(data.summary)
      setMessage('Review saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save review.')
    }
  }

  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.count > 0
              ? `${summary.averageRating.toFixed(1)} average from ${summary.count} review${summary.count === 1 ? '' : 's'}`
              : 'No reviews yet'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-semibold">{summary.averageRating ? summary.averageRating.toFixed(1) : 'New'}</span>
        </div>
      </div>

      {eligible && (
        <Card className="mb-6 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Your rating</Label>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="rounded-md p-1 text-primary"
                    aria-label={`${value} star rating`}
                  >
                    <Star className={`h-6 w-6 ${value <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor={`review-${serviceType}-${serviceId}`}>Your review</Label>
              <Textarea
                id={`review-${serviceType}-${serviceId}`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Share what made this experience memorable."
                className="mt-2 min-h-24"
              />
            </div>
            <Button type="submit">Save Review</Button>
          </form>
        </Card>
      )}

      {!eligible && AuthService.isAuthenticated() && AuthService.getUserRole() === 'user' && (
        <p className="mb-6 rounded-lg border border-border p-4 text-sm text-muted-foreground">
          You can leave a review after you have a confirmed booking for this service.
        </p>
      )}

      {message && <p className="mb-4 text-sm text-muted-foreground">{message}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No traveler reviews yet.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{review.user_name || 'Traveler'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-semibold">{review.rating}</span>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
