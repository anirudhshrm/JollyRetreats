import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Circle, Download, Loader2, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { COUNTRY_CODE_OPTIONS, buildContactNumber } from '@/lib/auth'
import AuthService from '@/services/authService'
import { createMappedServiceBooking, downloadInvoice, payAdvance, type ServiceBooking, type SupportedServiceType } from '@/services/bookingApi'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: {
    serviceType: SupportedServiceType
    serviceIdHint: number
    resolvedServiceId?: number | null
    name: string
    description: string
    location: string
    price: number
    priceSuffix: string
    scheduleLabel: string
    quantityLabel: string
    defaultBookingCount?: number
    maxBookingCount: number
    minAdvanceDays?: number
  }
  onBooked?: (booking: ServiceBooking) => void
}

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)
const DEFAULT_COUNTRY_CODE = COUNTRY_CODE_OPTIONS[0].value
const PHONE_REGEX = /^\+\d{11,14}$/

const formatDateLabel = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    return 'Date unavailable'
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatMoney = (value: number) => `$${value.toFixed(2)}`

const splitContactNumber = (value: string) => {
  const normalized = String(value || '').trim().replace(/[^\d+]/g, '')
  const matchedOption = COUNTRY_CODE_OPTIONS.find((option) => {
    if (!normalized.startsWith(option.value)) return false
    const localNumber = normalized.slice(option.value.length).replace(/\D/g, '')
    return localNumber.length <= option.localLength
  })

  if (!matchedOption) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      localContactNumber: normalized.replace(/\D/g, '').slice(0, 10)
    }
  }

  return {
    countryCode: matchedOption.value,
    localContactNumber: normalized
      .slice(matchedOption.value.length)
      .replace(/\D/g, '')
      .slice(0, matchedOption.localLength)
  }
}

const isValidAge = (value: string) => {
  const age = Number(value)
  return Number.isInteger(age) && age >= 1 && age <= 100
}

const isValidContactNumber = (value: string) => {
  const contactParts = splitContactNumber(value)
  const option = COUNTRY_CODE_OPTIONS.find((item) => item.value === contactParts.countryCode)
  const normalizedContactNumber = buildContactNumber(contactParts.countryCode, contactParts.localContactNumber)
  return Boolean(option && contactParts.localContactNumber.length === option.localLength && PHONE_REGEX.test(normalizedContactNumber))
}

export function ServiceBookingFlow({ open, onOpenChange, service, onBooked }: Props) {
  const currentUser = AuthService.getCurrentUser()
  const minBookingDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + (service.minAdvanceDays ?? 1))
    return toIsoDate(date)
  }, [service.minAdvanceDays])

  const [step, setStep] = useState(1)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingCount, setBookingCount] = useState(Math.min(service.defaultBookingCount ?? 1, service.maxBookingCount))
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [contactNo, setContactNo] = useState('')
  const [otherTravellers, setOtherTravellers] = useState<Array<{ name: string; age: string; email: string; contact: string }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<ServiceBooking | null>(null)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [payBusy, setPayBusy] = useState(false)
  const [advancePaid, setAdvancePaid] = useState<number | null>(null)

  useEffect(() => {
    if (!open) {
      setStep(1)
      setBookingDate('')
      setBookingCount(Math.min(service.defaultBookingCount ?? 1, service.maxBookingCount))
      setFullName('')
      setAge('')
      setEmail(currentUser?.email || '')
      setContactNo('')
      setOtherTravellers([])
      setErrors({})
      setSubmitting(false)
      setConfirmedBooking(null)
      setDownloadBusy(false)
    }
  }, [open, service.defaultBookingCount, service.maxBookingCount, currentUser?.email])

  // Update other travellers array when booking count changes
  useEffect(() => {
    const currentOtherCount = bookingCount - 1
    if (currentOtherCount > otherTravellers.length) {
      // Add empty traveller entries
      const newTravellers = [...otherTravellers]
      for (let i = otherTravellers.length; i < currentOtherCount; i++) {
        newTravellers.push({ name: '', age: '', email: '', contact: '' })
      }
      setOtherTravellers(newTravellers)
    } else if (currentOtherCount < otherTravellers.length) {
      // Remove extra traveller entries
      setOtherTravellers(otherTravellers.slice(0, currentOtherCount))
    }
  }, [bookingCount])

  const total = useMemo(() => service.price * bookingCount, [bookingCount, service.price])
  const steps = [
    { id: 1, label: 'Schedule' },
    { id: 2, label: 'Review' },
    { id: 3, label: 'Confirmed' },
  ]
  const progressValue = ((step - 1) / (steps.length - 1)) * 100
  const isSingleQuantity = service.maxBookingCount === 1

  const updatePrimaryContact = (countryCode: string, localContactNumber: string) => {
    const option = COUNTRY_CODE_OPTIONS.find((item) => item.value === countryCode) || COUNTRY_CODE_OPTIONS[0]
    const localDigits = localContactNumber.replace(/\D/g, '').slice(0, option.localLength)
    setContactNo(buildContactNumber(option.value, localDigits))
  }

  const updateOtherTravellerContact = (index: number, countryCode: string, localContactNumber: string) => {
    const option = COUNTRY_CODE_OPTIONS.find((item) => item.value === countryCode) || COUNTRY_CODE_OPTIONS[0]
    const localDigits = localContactNumber.replace(/\D/g, '').slice(0, option.localLength)
    setOtherTravellers((prev) => prev.map((traveller, travellerIndex) => (
      travellerIndex === index
        ? { ...traveller, contact: buildContactNumber(option.value, localDigits) }
        : traveller
    )))
  }

  const validateSchedule = () => {
    const nextErrors: Record<string, string> = {}
    if (!bookingDate) {
      nextErrors.bookingDate = `Please choose a ${service.scheduleLabel.toLowerCase()}.`
    } else if (bookingDate < minBookingDate) {
      nextErrors.bookingDate = `${service.scheduleLabel} must be on or after ${formatDateLabel(minBookingDate)}.`
    }
    if (!Number.isInteger(bookingCount) || bookingCount < 1) {
      nextErrors.bookingCount = `Please choose at least one ${service.quantityLabel.toLowerCase()}.`
    } else if (bookingCount > service.maxBookingCount) {
      nextErrors.bookingCount = `Only ${service.maxBookingCount} ${service.quantityLabel.toLowerCase()} available right now.`
    }
    if (!fullName || fullName.trim() === '') {
      nextErrors.fullName = 'Please enter your full name.'
    }
    if (!age || age.trim() === '') {
      nextErrors.age = 'Please enter your age.'
    } else if (!isValidAge(age)) {
      nextErrors.age = 'Please enter an age between 1 and 100.'
    }
    if (!email || email.trim() === '') {
      nextErrors.email = 'Please enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }
    if (!contactNo || contactNo.trim() === '') {
      nextErrors.contactNo = 'Please enter your contact number.'
    } else if (!isValidContactNumber(contactNo)) {
      nextErrors.contactNo = 'Choose a country code and enter exactly 10 digits.'
    }

    // Validate other travellers if bookingCount > 1
    if (bookingCount > 1) {
      otherTravellers.forEach((traveller, index) => {
        const prefix = `traveller_${index + 2}_`
        if (!traveller.name || traveller.name.trim() === '') {
          nextErrors[`${prefix}name`] = 'Please enter traveller name.'
        }
        if (!traveller.age || traveller.age.trim() === '') {
          nextErrors[`${prefix}age`] = 'Please enter traveller age.'
        } else if (!isValidAge(traveller.age)) {
          nextErrors[`${prefix}age`] = 'Please enter an age between 1 and 100.'
        }
        if (!traveller.email || traveller.email.trim() === '') {
          nextErrors[`${prefix}email`] = 'Please enter traveller email.'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(traveller.email)) {
          nextErrors[`${prefix}email`] = 'Please enter a valid email.'
        }
        if (!traveller.contact || traveller.contact.trim() === '') {
          nextErrors[`${prefix}contact`] = 'Please enter traveller contact.'
        } else if (!isValidContactNumber(traveller.contact)) {
          nextErrors[`${prefix}contact`] = 'Choose a country code and enter exactly 10 digits.'
        }
      })
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleInvoiceDownload = async () => {
    if (!confirmedBooking) return
    const token = AuthService.getToken()
    if (!token) {
      setErrors({ submit: 'Your session expired. Please sign in again.' })
      return
    }
    setDownloadBusy(true)
    try {
      const blob = await downloadInvoice(token, confirmedBooking.bookingId)
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `invoice-${confirmedBooking.bookingId}.pdf`
      anchor.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Unable to download invoice.' })
    } finally {
      setDownloadBusy(false)
    }
  }

  const handleContinue = () => {
    if (validateSchedule()) {
      setErrors({})
      setStep(2)
    }
  }

  const handleConfirm = async () => {
    const token = AuthService.getToken()
    if (!token) {
      setErrors({ submit: 'Your session expired. Please sign in again.' })
      return
    }

    setSubmitting(true)
    setErrors({})
    try {
      // Prepare travelers array
      const allTravellers = [
        { name: fullName, age, email, contact: contactNo },
        ...otherTravellers
      ]

      const booking = await createMappedServiceBooking({
        token,
        serviceType: service.serviceType,
        serviceName: service.name,
        serviceIdHint: service.resolvedServiceId || service.serviceIdHint,
        bookingDate: `${bookingDate} 00:00:00`,
        bookingCount,
        status: 'confirmed',
        serviceDescription: service.description,
        serviceLocation: service.location,
        servicePrice: service.price,
        travelers: allTravellers
      })
      setConfirmedBooking(booking)
      setStep(3)
      onBooked?.(booking)
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Unable to confirm booking.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CalendarDays className="h-5 w-5 text-primary" />
            Book {service.name}
          </DialogTitle>
          <DialogDescription>
            Confirm your reservation details and secure your booking instantly.
          </DialogDescription>
          <div className="mt-4">
            <Progress value={progressValue} className="h-2" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {steps.map((item) => {
              const active = item.id === step
              const completed = item.id < step
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border px-4 py-3 text-sm ${active ? 'border-primary bg-primary/5' : 'border-border bg-background'} ${completed ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}
                >
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    {completed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />}
                    {item.label}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-5">
            {step === 1 && (
              <Card className="space-y-5 p-5">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Choose your reservation details</h3>
                  <p className="mt-1 text-sm text-muted-foreground">We’ll confirm this booking immediately once you submit it.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">{service.scheduleLabel}</span>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      type="date"
                      min={minBookingDate}
                      value={bookingDate}
                      onChange={(event) => setBookingDate(event.target.value)}
                    />
                    {errors.bookingDate && <p className="text-xs text-red-500">{errors.bookingDate}</p>}
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">{service.quantityLabel}</span>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      type="number"
                      min={1}
                      max={service.maxBookingCount}
                      value={bookingCount}
                      disabled={isSingleQuantity}
                      onChange={(event) => setBookingCount(Number(event.target.value || 1))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isSingleQuantity ? `This booking is limited to 1 ${service.quantityLabel.toLowerCase().slice(0, -1) || service.quantityLabel.toLowerCase()}.` : `Up to ${service.maxBookingCount} ${service.quantityLabel.toLowerCase()} available.`}
                    </p>
                    {errors.bookingCount && <p className="text-xs text-red-500">{errors.bookingCount}</p>}
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Full Name</span>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                    {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Age</span>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      type="number"
                      min={1}
                      max={100}
                      placeholder="Enter your age"
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                    />
                    {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Email</span>
                    <input
                      className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Contact Number</span>
                    {(() => {
                      const contactParts = splitContactNumber(contactNo)
                      const selectedCountry = COUNTRY_CODE_OPTIONS.find((option) => option.value === contactParts.countryCode) || COUNTRY_CODE_OPTIONS[0]
                      return (
                        <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-4">
                          <select
                            className="h-10 rounded-xl border border-border bg-background px-2 py-2 text-center text-xs"
                            value={contactParts.countryCode}
                            title={selectedCountry.label}
                            onChange={(event) => updatePrimaryContact(event.target.value, contactParts.localContactNumber)}
                          >
                            {COUNTRY_CODE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.value}</option>
                            ))}
                          </select>
                          <input
                            className="h-10 w-full rounded-xl border border-border bg-background px-3 py-2"
                            type="tel"
                            inputMode="numeric"
                            maxLength={selectedCountry.localLength}
                            placeholder={`${selectedCountry.localLength}-digit number`}
                            value={contactParts.localContactNumber}
                            onChange={(event) => updatePrimaryContact(contactParts.countryCode, event.target.value)}
                          />
                        </div>
                      )
                    })()}
                    <p className="text-xs text-muted-foreground">Select a country code and enter exactly 10 digits.</p>
                    {errors.contactNo && <p className="text-xs text-red-500">{errors.contactNo}</p>}
                  </label>
                </div>

                {bookingCount > 1 && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <h4 className="font-medium text-foreground">Other Traveller Details</h4>
                    {otherTravellers.map((traveller, index) => (
                      <div key={index} className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                        <p className="text-sm font-medium text-foreground">Traveller {index + 2}</p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-foreground">Full Name</span>
                            <input
                              className="w-full rounded-xl border border-border bg-background px-3 py-2"
                              type="text"
                              placeholder="Enter traveller's full name"
                              value={traveller.name}
                              onChange={(event) => {
                                const newTravellers = [...otherTravellers]
                                newTravellers[index].name = event.target.value
                                setOtherTravellers(newTravellers)
                              }}
                            />
                            {errors[`traveller_${index + 2}_name`] && (
                              <p className="text-xs text-red-500">{errors[`traveller_${index + 2}_name`]}</p>
                            )}
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-foreground">Age</span>
                            <input
                              className="w-full rounded-xl border border-border bg-background px-3 py-2"
                              type="number"
                              min={1}
                              max={100}
                              placeholder="Enter traveller's age"
                              value={traveller.age}
                              onChange={(event) => {
                                const newTravellers = [...otherTravellers]
                                newTravellers[index].age = event.target.value
                                setOtherTravellers(newTravellers)
                              }}
                            />
                            {errors[`traveller_${index + 2}_age`] && (
                              <p className="text-xs text-red-500">{errors[`traveller_${index + 2}_age`]}</p>
                            )}
                          </label>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-foreground">Email</span>
                            <input
                              className="w-full rounded-xl border border-border bg-background px-3 py-2"
                              type="email"
                              placeholder="Enter traveller's email"
                              value={traveller.email}
                              onChange={(event) => {
                                const newTravellers = [...otherTravellers]
                                newTravellers[index].email = event.target.value
                                setOtherTravellers(newTravellers)
                              }}
                            />
                            {errors[`traveller_${index + 2}_email`] && (
                              <p className="text-xs text-red-500">{errors[`traveller_${index + 2}_email`]}</p>
                            )}
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-foreground">Contact Number</span>
                            {(() => {
                              const contactParts = splitContactNumber(traveller.contact)
                              const selectedCountry = COUNTRY_CODE_OPTIONS.find((option) => option.value === contactParts.countryCode) || COUNTRY_CODE_OPTIONS[0]
                              return (
                                <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-4">
                                  <select
                                    className="h-10 rounded-xl border border-border bg-background px-2 py-2 text-center text-xs"
                                    value={contactParts.countryCode}
                                    title={selectedCountry.label}
                                    onChange={(event) => updateOtherTravellerContact(index, event.target.value, contactParts.localContactNumber)}
                                  >
                                    {COUNTRY_CODE_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>{option.value}</option>
                                    ))}
                                  </select>
                                  <input
                                    className="h-10 w-full rounded-xl border border-border bg-background px-3 py-2"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={selectedCountry.localLength}
                                    placeholder={`${selectedCountry.localLength}-digit number`}
                                    value={contactParts.localContactNumber}
                                    onChange={(event) => updateOtherTravellerContact(index, contactParts.countryCode, event.target.value)}
                                  />
                                </div>
                              )
                            })()}
                            <p className="text-xs text-muted-foreground">Select a country code and enter exactly 10 digits.</p>
                            {errors[`traveller_${index + 2}_contact`] && (
                              <p className="text-xs text-red-500">{errors[`traveller_${index + 2}_contact`]}</p>
                            )}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {step === 2 && (
              <Card className="space-y-5 p-5">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Review your booking</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Please confirm the schedule, quantity, and billing details before we place the booking.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium text-foreground">Service</p>
                    <p className="mt-1 text-sm text-muted-foreground">{service.name}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium text-foreground">{service.scheduleLabel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatDateLabel(bookingDate)}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium text-foreground">Full Name</p>
                    <p className="mt-1 text-sm text-muted-foreground">{fullName}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium text-foreground">Age</p>
                    <p className="mt-1 text-sm text-muted-foreground">{age}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="mt-1 text-sm text-muted-foreground">{email}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium text-foreground">Contact Number</p>
                    <p className="mt-1 text-sm text-muted-foreground">{contactNo}</p>
                  </div>
                </div>
                {bookingCount > 1 && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="font-medium text-foreground">Other Traveller Details</p>
                    {otherTravellers.map((traveller, index) => (
                      <div key={index} className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <p className="text-sm font-medium text-foreground">Traveller {index + 2} - Name</p>
                          <p className="mt-1 text-sm text-muted-foreground">{traveller.name}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <p className="text-sm font-medium text-foreground">Age</p>
                          <p className="mt-1 text-sm text-muted-foreground">{traveller.age}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <p className="text-sm font-medium text-foreground">Email</p>
                          <p className="mt-1 text-sm text-muted-foreground">{traveller.email}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <p className="text-sm font-medium text-foreground">Contact Number</p>
                          <p className="mt-1 text-sm text-muted-foreground">{traveller.contact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">Description</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{service.description}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">Booked by</p>
                  <p className="mt-1 text-sm text-muted-foreground">{currentUser?.fullName || 'Current user'}</p>
                  <p className="text-sm text-muted-foreground">{currentUser?.email || 'Email unavailable'}</p>
                </div>
                {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
              </Card>
            )}

            {step === 3 && confirmedBooking && (
              <Card className="space-y-5 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Booking confirmed</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Booking #{confirmedBooking.bookingId} has been confirmed successfully.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">{service.scheduleLabel}</p>
                    <p className="mt-1 text-muted-foreground">{formatDateLabel(bookingDate)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Quantity</p>
                    <p className="mt-1 text-muted-foreground">{confirmedBooking.bookingCount} {service.quantityLabel}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Full Name</p>
                    <p className="mt-1 text-muted-foreground">{fullName}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Age</p>
                    <p className="mt-1 text-muted-foreground">{age}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Email</p>
                    <p className="mt-1 text-muted-foreground">{email}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Contact Number</p>
                    <p className="mt-1 text-muted-foreground">{contactNo}</p>
                  </div>
                </div>
                {bookingCount > 1 && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="font-medium text-foreground">Other Traveller Details</p>
                    {otherTravellers.map((traveller, index) => (
                      <div key={index} className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                          <p className="font-medium text-foreground">Traveller {index + 2} - Name</p>
                          <p className="mt-1 text-muted-foreground">{traveller.name}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                          <p className="font-medium text-foreground">Age</p>
                          <p className="mt-1 text-muted-foreground">{traveller.age}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                          <p className="font-medium text-foreground">Email</p>
                          <p className="mt-1 text-muted-foreground">{traveller.email}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                          <p className="font-medium text-foreground">Contact Number</p>
                          <p className="mt-1 text-muted-foreground">{traveller.contact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                  <Button onClick={handleInvoiceDownload} disabled={downloadBusy} className="gap-2">
                    {downloadBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Download className="h-4 w-4" />
                    Download Invoice
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!confirmedBooking) return
                      const token = AuthService.getToken()
                      if (!token) {
                        toast.error('Please sign in to pay advance')
                        return
                      }
                      const advancePercent = 0.25
                      const amount = Math.round((service.price * confirmedBooking.bookingCount * advancePercent) * 100) / 100
                      if (!window.confirm(`Pay an advance of ${formatMoney(amount)} now?`)) return
                      try {
                        setPayBusy(true)
                        const result = await payAdvance(token, confirmedBooking.bookingId, amount)
                        setAdvancePaid(amount)
                        toast.success('Advance payment successful')
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Advance payment failed')
                      } finally {
                        setPayBusy(false)
                      }
                    }}
                    disabled={payBusy || advancePaid !== null}
                    className="gap-2"
                  >
                    {payBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                    <CreditCard className="h-4 w-4" />
                    {advancePaid ? `Advance paid ${formatMoney(advancePaid)}` : 'Pay Advance'}
                  </Button>
                </div>
              </Card>
            )}

            {step < 3 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div className="flex gap-3">
                  {step > 1 && (
                    <Button variant="outline" onClick={() => setStep((current) => current - 1)}>
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  {step === 1 && <Button onClick={handleContinue}>Continue</Button>}
                  {step === 2 && (
                    <Button onClick={handleConfirm} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm Booking
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <Card className="h-fit space-y-4 p-5">
            <div>
              <p className="text-sm font-medium text-foreground">Booking Summary</p>
              <p className="mt-1 text-sm text-muted-foreground">{service.name}</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unit price</span>
                <span className="font-medium text-foreground">{formatMoney(service.price)} {service.priceSuffix}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{service.quantityLabel}</span>
                <span className="font-medium text-foreground">{bookingCount}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Estimated total</span>
                  <span className="text-lg font-semibold text-foreground">{formatMoney(total)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              {service.scheduleLabel}: {bookingDate ? formatDateLabel(bookingDate) : 'Choose a date to continue.'}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ServiceBookingFlow
