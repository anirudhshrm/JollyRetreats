import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle2, AlertCircle, Lock, CreditCard } from 'lucide-react'
import AuthService from '@/services/authService'
import { createPaymentIntent, confirmPayment } from '@/services/paymentService'
import { toast } from 'sonner'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder')

interface PaymentState {
  bookingId: number
  amount: number
  currency: string
  bookingReference: string
  serviceName?: string
  quantity?: number
}

interface BillingDetails {
  email: string
  country: string
  cardholderName: string
}

function PaymentForm({ state }: { state: PaymentState }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [success, setSuccess] = useState(false)
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    email: '',
    country: 'United Kingdom',
    cardholderName: ''
  })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card')
  const user = AuthService.getCurrentUser()

  // Initialize payment intent
  useEffect(() => {
    const token = AuthService.getToken()
    if (!token) {
      setError('Please sign in to continue')
      return
    }

    const initPayment = async () => {
      try {
        const intent = await createPaymentIntent(token, state.bookingId, state.amount)
        setClientSecret(intent.clientSecret)
        // Pre-fill email from user
        if (user?.email) {
          setBillingDetails(prev => ({ ...prev, email: user.email }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize payment')
      }
    }

    void initPayment()
  }, [state, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return

    setLoading(true)
    setError('')

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingDetails.cardholderName || user?.fullName || 'Guest',
            email: billingDetails.email
          }
        }
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
        return
      }

      if (result.paymentIntent?.status === 'succeeded') {
        const token = AuthService.getToken()
        if (!token) throw new Error('Session expired')

        // Confirm payment on backend
        await confirmPayment(token, state.bookingId, result.paymentIntent.id)
        setSuccess(true)
        toast.success('Payment successful!')
        
        setTimeout(() => {
          navigate('/checkout', { 
            state: { 
              paymentComplete: true, 
              bookingId: state.bookingId,
              advancePaid: state.amount 
            } 
          })
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
      toast.error(err instanceof Error ? err.message : 'Payment error')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 animate-pulse" />
        <h2 className="mt-6 text-2xl font-semibold text-foreground">Payment Successful!</h2>
        <p className="mt-3 text-muted-foreground">Your booking has been confirmed. Redirecting...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Payment Methods */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Payment Method</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {['card', 'applepay', 'googlepay'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedPaymentMethod(method)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                selectedPaymentMethod === method
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              {method === 'card' && <CreditCard className="h-5 w-5" />}
              {method === 'applepay' && 'Apple Pay'}
              {method === 'googlepay' && 'Google Pay'}
            </button>
          ))}
        </div>
      </div>

      {/* Cardholder Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Cardholder Name</label>
          <input
            type="text"
            value={billingDetails.cardholderName}
            onChange={(e) => setBillingDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
            placeholder="Test"
            className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Card Element */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Card Number</label>
          <div className="px-4 py-3 bg-muted border border-border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    '::placeholder': {
                      color: '#6b7280',
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Expiry & CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Expiry Date</label>
            <input
              type="text"
              placeholder="12 / 29"
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">CVV2</label>
            <input
              type="text"
              placeholder="CVV2"
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              maxLength={4}
            />
          </div>
        </div>
      </div>

      {/* Billing Details */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground">Billing Details</h3>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email</label>
          <input
            type="email"
            value={billingDetails.email}
            onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
            placeholder="name@example.com"
            className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Country</label>
          <select
            value={billingDetails.country}
            onChange={(e) => setBillingDetails(prev => ({ ...prev, country: e.target.value }))}
            className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option>United Kingdom</option>
            <option>United States</option>
            <option>Canada</option>
            <option>Australia</option>
            <option>India</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-100">{error}</p>
        </div>
      )}

      {/* Place Order Button */}
      <Button
        type="submit"
        disabled={loading || !stripe || !clientSecret}
        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Place Order
          </>
        )}
      </Button>

      {/* Security Info */}
      <div className="text-center space-y-2 text-xs text-muted-foreground border-t border-border pt-6">
        <p>🔒 Your payment is secured by Stripe</p>
        <p>We accept all major debit & credit cards</p>
      </div>
    </form>
  )
}

export default function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<PaymentState | null>(null)

  useEffect(() => {
    // Get payment state from URL params or navigation state
    const bookingId = searchParams.get('bookingId')
    const amount = searchParams.get('amount')
    const bookingRef = searchParams.get('ref')

    if (!bookingId || !amount) {
      toast.error('Invalid payment session')
      navigate('/properties')
      return
    }

    setState({
      bookingId: Number(bookingId),
      amount: Math.round(Number(amount) * 100) / 100,
      currency: 'usd',
      bookingReference: bookingRef || `#${bookingId}`,
      serviceName: searchParams.get('service') || 'Booking',
      quantity: Number(searchParams.get('qty') || 1)
    })
  }, [searchParams, navigate])

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Payment Form */}
          <div className="lg:col-span-2">
            <Card className="border-slate-700 bg-slate-800/50 p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">Secure Checkout</h1>
                <p className="mt-2 text-slate-400">Choose your preferred payment method</p>
              </div>

              <Elements stripe={stripePromise}>
                <PaymentForm state={state} />
              </Elements>

              <div className="mt-8 pt-6 border-t border-slate-700">
                <p className="text-center text-xs text-slate-500">
                  🔒 Secure payment powered by Stripe • We accept all major debit & credit cards
                </p>
              </div>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="border-blue-500/50 bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-2xl">
                <h2 className="text-2xl font-bold mb-6">Your Order</h2>

                {/* Order Items */}
                <div className="space-y-4 pb-6 border-b border-blue-400">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{state.serviceName}</p>
                      <p className="text-sm text-blue-100">Quantity: {state.quantity}</p>
                    </div>
                    <p className="font-semibold text-lg">
                      ${state.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-3 py-6 border-b border-blue-400">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-100">Subtotal</span>
                    <span className="font-medium">${state.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-100">Promo Code Applied</span>
                    <span className="font-medium">- $0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-100">Shipping & Handling</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-100">Estimated Tax</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                </div>

                {/* Order Total */}
                <div className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Order Total</span>
                    <span className="text-3xl font-bold">
                      ${state.amount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100">
                    25% advance payment • Balance due at confirmation
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
