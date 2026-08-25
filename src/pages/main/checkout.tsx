import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CalendarDays, CheckCircle2, Download, MapPin, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthService from "@/services/authService"
import { canCreateReservation } from "@/auth/privileges"
import { getApiBaseUrl } from "@/lib/api-base"
import { COUNTRY_CODE_OPTIONS, buildContactNumber } from "@/lib/auth"

const API_BASE = getApiBaseUrl("/api")
const DEFAULT_COUNTRY_CODE = COUNTRY_CODE_OPTIONS[0].value
const PHONE_REGEX = /^\+\d{11,14}$/

interface CheckoutState {
  type: "property"
  itemId: string
  itemName: string
  location: string
  image: string
  unitPrice: number
  checkIn: string
  checkOut: string
  guests: number
  maxGuests: number
}

interface GuestDetail {
  name: string
  age: string
  contact: string
  email: string
}

interface ReceiptDetails {
  bookingId: number
  bookingDate: string
  createdAt: string
  status: string
}

const formatMoney = (value: number) => `$${value.toFixed(2)}`
const checkoutPageBg = "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_34%),linear-gradient(180deg,#05070a_0%,#0b0f14_46%,#05070a_100%)]"
const formatDisplayDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : value

const getAgeDisplayLabel = (age: string | number): string => {
  const ageNum = typeof age === "string" ? Number(age) : age
  if (!Number.isNaN(ageNum) && ageNum > 0 && ageNum <= 5) {
    return `${ageNum} (child)`
  }
  return String(age)
}

const splitContactNumber = (value: string) => {
  const normalized = String(value || "").trim().replace(/[^\d+]/g, "")
  const matchedOption = COUNTRY_CODE_OPTIONS.find((option) => {
    if (!normalized.startsWith(option.value)) return false
    const localNumber = normalized.slice(option.value.length).replace(/\D/g, "")
    return localNumber.length <= option.localLength
  })

  if (!matchedOption) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      localContactNumber: normalized.replace(/\D/g, "").slice(0, 10)
    }
  }

  return {
    countryCode: matchedOption.value,
    localContactNumber: normalized
      .slice(matchedOption.value.length)
      .replace(/\D/g, "")
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

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const checkoutState = location.state as CheckoutState | null
  const userRole = AuthService.getUserRole()
  const canReserve = canCreateReservation(userRole)
  const user = AuthService.getCurrentUser()

  const [checkIn, setCheckIn] = useState(checkoutState?.checkIn ?? "")
  const [checkOut, setCheckOut] = useState(checkoutState?.checkOut ?? "")
  const [guests, setGuests] = useState(checkoutState?.guests ?? 1)
  const [guestDetails, setGuestDetails] = useState<GuestDetail[]>([])
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetails | null>(null)

  // Initialize guest details when guests count changes
  const handleGuestCountChange = (newCount: number) => {
    setGuests(newCount)
    const userEmail = user?.email || ""
    const newDetails: GuestDetail[] = Array(newCount).fill(null).map(() => ({ name: "", age: "", contact: "", email: userEmail }))
    setGuestDetails(newDetails)
  }

  const updateGuestContact = (index: number, countryCode: string, localContactNumber: string) => {
    const option = COUNTRY_CODE_OPTIONS.find((item) => item.value === countryCode) || COUNTRY_CODE_OPTIONS[0]
    const localDigits = localContactNumber.replace(/\D/g, "").slice(0, option.localLength)
    setGuestDetails((current) => current.map((guest, guestIndex) => (
      guestIndex === index
        ? { ...guest, contact: buildContactNumber(option.value, localDigits) }
        : guest
    )))
  }

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1
    const inDate = new Date(checkIn)
    const outDate = new Date(checkOut)
    const diffDays = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, diffDays)
  }, [checkIn, checkOut])

  const total = checkoutState ? nights * checkoutState.unitPrice : 0

  if (!canReserve) {
    return (
      <div className={`${checkoutPageBg} px-6 py-16`}>
        <Card className="mx-auto max-w-md border-border/70 bg-card/95 p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <h1 className="font-serif text-2xl font-bold text-foreground">Admin Access Restricted</h1>
          <p className="mt-3 text-muted-foreground">
            Checkout and reservation creation are available for user accounts only.
          </p>
          <Button className="mt-6" onClick={() => navigate("/admin-dashboard")}>
            Back to Admin Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  if (!checkoutState || checkoutState.type !== "property") {
    return (
      <div className={`${checkoutPageBg} px-6 py-16`}>
        <Card className="mx-auto max-w-md border-border/70 bg-card/95 p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <h1 className="font-serif text-2xl font-bold text-foreground">No booking selected</h1>
          <p className="mt-3 text-muted-foreground">
            Select a property and click Reserve Now to start checkout.
          </p>
          <Link to="/properties">
            <Button className="mt-6">Browse Properties</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const handleConfirm = () => {
    if (!checkIn || !checkOut) {
      setSubmitError("Please select both check-in and check-out dates.")
      return
    }
    if (checkOut <= checkIn) {
      setSubmitError("Check-out must be after check-in.")
      return
    }

    // Validate guest details
    if (guestDetails.length !== guests) {
      setSubmitError("Please fill in details for all guests.")
      return
    }

    const invalidGuests = guestDetails.filter(
      (g) => !g.name?.trim() || !g.age?.trim() || !g.contact?.trim()
    )

    if (invalidGuests.length > 0) {
      setSubmitError("Please fill in complete details (name, age, and contact) for all guests.")
      return
    }

    const invalidAgeGuest = guestDetails.find((guest) => !isValidAge(guest.age))
    if (invalidAgeGuest) {
      setSubmitError("Guest age must be a whole number between 1 and 100.")
      return
    }

    const invalidContactGuest = guestDetails.find((guest) => !isValidContactNumber(guest.contact))
    if (invalidContactGuest) {
      setSubmitError("Select a country code and enter exactly 10 digits for each contact number.")
      return
    }

    setSubmitError("")

    const token = AuthService.getToken()
    if (!token) {
      setSubmitError("Please log in again to complete your reservation.")
      return
    }

    const serviceId = Number(String(checkoutState.itemId).replace(/\D/g, ""))
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      setSubmitError("Invalid property selected for booking.")
      return
    }

    void (async () => {
      try {
        const response = await fetch(`${API_BASE}/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            serviceType: "property",
            serviceId,
            bookingCount: guests,
            bookingDate: `${checkIn} 00:00:00`,
            dropoffDate: `${checkOut} 00:00:00`,
            status: "confirmed",
            serviceName: checkoutState.itemName,
            serviceLocation: checkoutState.location,
            servicePrice: checkoutState.unitPrice,
            guestDetails: guestDetails
          }),
        })
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Unable to confirm reservation")
        }
        setReceiptDetails({
          bookingId: Number(payload?.data?.id || 0),
          bookingDate: String(payload?.data?.booking_date || `${checkIn} 00:00:00`),
          createdAt: String(payload?.data?.created_at || new Date().toISOString()),
          status: String(payload?.data?.status || "confirmed")
        })
        setIsConfirmed(true)
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to confirm reservation")
      }
    })()
  }

  const downloadReceipt = () => {
    if (!checkoutState || !receiptDetails) return
    const user = AuthService.getCurrentUser()
    const content = [
      "JOLLY RETREATS - BOOKING RECEIPT",
      "--------------------------------",
      `Receipt Generated: ${new Date().toISOString()}`,
      `Booking ID: ${receiptDetails.bookingId || "N/A"}`,
      `Booking Status: ${receiptDetails.status}`,
      `Booking Date: ${receiptDetails.bookingDate}`,
      `Created At: ${receiptDetails.createdAt}`,
      "",
      `Guest Name: ${user?.fullName || "N/A"}`,
      `Guest Email: ${user?.email || "N/A"}`,
      "",
      `Service Type: Property`,
      `Property: ${checkoutState.itemName}`,
      `Location: ${checkoutState.location}`,
      `Check-in: ${checkIn}`,
      `Check-out: ${checkOut}`,
      `Guests: ${guests}`,
      "",
      `Rate per night: $${checkoutState.unitPrice}`,
      `Nights: ${nights}`,
      `Total Paid: $${total}`,
      "",
      "Thank you for booking with Jolly Retreats."
    ].join("\n")

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `booking-receipt-${receiptDetails.bookingId || Date.now()}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const generateInvoicePdf = (): Blob => {
    if (!checkoutState || !receiptDetails) {
      throw new Error("Missing booking details")
    }
    const user = AuthService.getCurrentUser()
    const invoiceDate = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
    const invoiceNumber = `INV-${receiptDetails.bookingId}-${new Date().getFullYear()}`

    const invoiceHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Invoice-${receiptDetails.bookingId}</title>
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        color: #1f2937; 
        margin: 0;
        padding: 20px;
        background: #f9fafb;
      }
      .wrap { 
        max-width: 800px; 
        margin: 0 auto;
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .header { 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start; 
        margin-bottom: 40px;
        border-bottom: 2px solid #1b6b4a;
        padding-bottom: 20px;
      }
      .brand { 
        font-size: 32px; 
        font-weight: 700;
        color: #1b6b4a;
      }
      .invoice-type {
        color: #6b7280;
        font-size: 14px;
        margin-top: 4px;
      }
      .invoice-details {
        text-align: right;
        font-size: 14px;
      }
      .invoice-details div {
        margin-bottom: 8px;
      }
      .label {
        color: #6b7280;
        font-weight: 500;
      }
      .value {
        color: #1f2937;
        font-weight: 600;
      }
      .section { 
        margin-bottom: 30px;
      }
      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: #1b6b4a;
        letter-spacing: 1px;
        margin-bottom: 12px;
      }
      .section-content {
        background: #f9fafb;
        padding: 16px;
        border-radius: 6px;
        border-left: 4px solid #1b6b4a;
      }
      .section-content div {
        margin-bottom: 8px;
        font-size: 14px;
      }
      .section-content div:last-child {
        margin-bottom: 0;
      }
      .guest-info, .property-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 12px;
      }
      th { 
        text-align: left; 
        padding: 12px;
        background: #f9fafb;
        border-bottom: 2px solid #e5e7eb;
        font-weight: 600;
        font-size: 13px;
        color: #374151;
      }
      td { 
        text-align: left; 
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 14px;
      }
      th:last-child, td:last-child { 
        text-align: right;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        font-size: 14px;
      }
      .summary-row.subtotal {
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 12px;
        margin-bottom: 12px;
      }
      .summary-row.total {
        font-size: 18px;
        font-weight: 700;
        color: #1b6b4a;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
      }
      .status-badge {
        display: inline-block;
        background: #d1fae5;
        color: #065f46;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 600;
      }
      @media print { 
        body { margin: 0; padding: 0; background: white; }
        .wrap { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <div>
          <div class="brand">Jolly Retreats</div>
          <div class="invoice-type">Property Booking Invoice</div>
        </div>
        <div class="invoice-details">
          <div><span class="label">Invoice Number:</span><br><span class="value">${invoiceNumber}</span></div>
          <div><span class="label">Booking Reference:</span><br><span class="value">#${receiptDetails.bookingId}</span></div>
          <div><span class="label">Issue Date:</span><br><span class="value">${invoiceDate}</span></div>
          <div><span class="status-badge">${receiptDetails.status.toUpperCase()}</span></div>
        </div>
      </div>

      <div class="guest-info">
        <div class="section">
          <div class="section-title">Bill To</div>
          <div class="section-content">
            <div><strong>${user?.fullName || "Guest"}</strong></div>
            <div>${user?.email || "N/A"}</div>
            <div>${user?.contactNumber || "N/A"}</div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Booking Details</div>
          <div class="section-content">
            <div><strong>Check-in:</strong> ${formatDisplayDate(checkIn)}</div>
            <div><strong>Check-out:</strong> ${formatDisplayDate(checkOut)}</div>
            <div><strong>Duration:</strong> ${nights} night${nights !== 1 ? "s" : ""}</div>
            <div><strong>Guests:</strong> ${guests}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Guest Information</div>
        <div class="section-content">
          ${guestDetails.map((guest, i) => `
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
              <strong>Guest ${i + 1}</strong><br>
              Name: ${guest.name || "N/A"}<br>
              Age: ${guest.age ? getAgeDisplayLabel(guest.age) : "N/A"}<br>
              Contact: ${guest.contact || "N/A"}
            </div>
          `).join("")}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Property Details</div>
        <div class="section-content">
          <div><strong>${checkoutState.itemName}</strong></div>
          <div>📍 ${checkoutState.location}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Itemized Charges</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${checkoutState.itemName} - Nightly Rate</td>
              <td>${nights}</td>
              <td>${formatMoney(checkoutState.unitPrice)}</td>
              <td>${formatMoney(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div style="background: #f9fafb; padding: 20px; border-radius: 6px;">
          <div class="summary-row subtotal">
            <span>Subtotal:</span>
            <span>${formatMoney(total)}</span>
          </div>
          <div class="summary-row total">
            <span>Total Due:</span>
            <span>${formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for booking with Jolly Retreats!</p>
        <p>This is an electronically generated invoice. Please retain for your records.</p>
        <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">Generated on ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </body>
</html>`

    return new Blob([invoiceHtml], { type: "text/html" })
  }

  const downloadInvoicePdf = () => {
    try {
      const blob = generateInvoicePdf()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `invoice-${receiptDetails?.bookingId}-${new Date().getFullYear()}.html`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      // Keep URL alive briefly for download, then revoke
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to download invoice")
    }
  }

  const downloadBillPdf = () => {
    if (!checkoutState || !receiptDetails) return
    
    try {
      const blob = generateInvoicePdf()
      const url = URL.createObjectURL(blob)
      const billWindow = window.open(url, "_blank", "width=900,height=700")
      if (!billWindow) {
        setSubmitError("Unable to open the bill preview window. Please check your pop-up blocker.")
        URL.revokeObjectURL(url)
        return
      }
      billWindow.focus()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to open preview")
    }
  }

  const viewInvoiceOnline = () => {
    try {
      const blob = generateInvoicePdf()
      const url = URL.createObjectURL(blob)
      const viewWindow = window.open(url, "_blank", "width=1000,height=800")
      if (!viewWindow) {
        setSubmitError("Unable to open invoice. Please check your pop-up blocker.")
        URL.revokeObjectURL(url)
        return
      }
      viewWindow.focus()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to view invoice")
    }
  }

  if (isConfirmed) {
    return (
      <div className={`${checkoutPageBg} px-6 py-16`}>
        <Card className="mx-auto max-w-2xl border-border/70 bg-card/95 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-10">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
            <h1 className="mt-4 font-serif text-3xl font-bold text-foreground">Reservation Confirmed!</h1>
            <p className="mt-3 text-muted-foreground">
              Your stay at {checkoutState.itemName} is reserved from {checkIn} to {checkOut}.
            </p>
            <p className="mt-1 text-sm font-semibold text-primary">Booking Reference #: {receiptDetails?.bookingId}</p>
          </div>
          
          <div className="mt-8 grid gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4 text-left sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Guests</p>
              <p className="mt-1 font-semibold text-foreground">{guests}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dates</p>
              <p className="mt-1 font-semibold text-foreground">{formatDisplayDate(checkIn)} to {formatDisplayDate(checkOut)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
              <p className="mt-1 font-semibold text-foreground">{formatMoney(total)}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-300">📋 Invoice Options</p>
              <p className="mt-1 text-sm text-emerald-100/80">Download or view your official invoice.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={downloadInvoicePdf}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </Button>
                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={viewInvoiceOnline}>
                  📱 View Online
                </Button>
              </div>
            </div>
            
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Payment</p>
              <p className="mt-1 text-sm text-muted-foreground">You can pay an advance deposit of 25% to secure your reservation.</p>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={() => {
                    if (!receiptDetails) return
                    const amount = Math.round((total * 0.25) * 100) / 100
                    navigate(`/payment?bookingId=${receiptDetails.bookingId}&amount=${amount}&ref=${receiptDetails.bookingId}`)
                  }}
                  className="flex-1"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay 25% Advance
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="outline" onClick={downloadBillPdf}>
                🖨️ Print Invoice
              </Button>
              <Button variant="outline" onClick={downloadReceipt}>
                <Download className="mr-2 h-4 w-4" />
                Text Receipt
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => navigate("/properties")}>
              Explore More Properties
            </Button>
            <Button onClick={() => navigate("/user-dashboard")}>Go to My Dashboard</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${checkoutPageBg} py-12`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Property Checkout</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-foreground sm:text-5xl">Complete Your Stay</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Review your travel dates, guest count, and final stay total before confirming your reservation.
            </p>
          </div>
          <Link to="/properties">
            <Button variant="outline" className="w-full sm:w-auto">Back to Properties</Button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 bg-card/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-border/70 bg-muted/25 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stay Snapshot</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Property</p>
                    <p className="mt-1 font-semibold text-foreground">{checkoutState.itemName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="mt-1 font-semibold text-foreground">{checkoutState.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nightly Rate</p>
                    <p className="mt-1 font-semibold text-foreground">{formatMoney(checkoutState.unitPrice)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground">Reservation Details</h2>
                <p className="mt-2 text-sm text-muted-foreground">Choose your check-in, check-out, and guest count.</p>
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {submitError}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="check-in" className="text-sm font-medium">Check-in</Label>
                  <Input
                    id="check-in"
                    type="date"
                    className="h-12 rounded-xl border-border/70 bg-background"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check-out" className="text-sm font-medium">Check-out</Label>
                  <Input
                    id="check-out"
                    type="date"
                    className="h-12 rounded-xl border-border/70 bg-background"
                    value={checkOut}
                    min={checkIn || undefined}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guests" className="text-sm font-medium">Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  max={checkoutState.maxGuests}
                  className="h-12 rounded-xl border-border/70 bg-background"
                  value={guests}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    if (!Number.isNaN(value)) {
                      handleGuestCountChange(Math.min(Math.max(1, value), checkoutState.maxGuests))
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Maximum allowed: {checkoutState.maxGuests} guests.</p>
              </div>

              {/* Guest Details Section */}
              {guests > 0 && (
                <div className="mt-6 space-y-4 rounded-2xl border border-border/70 bg-secondary/30 p-5">
                  <div>
                    <h3 className="font-semibold text-foreground">Guest Details</h3>
                    <p className="text-xs text-muted-foreground">Please provide information for {guests} guest{guests !== 1 ? "s" : ""}</p>
                  </div>
                  
                  <div className="space-y-4">
                    {Array.from({ length: guests }).map((_, index) => (
                      <div key={index} className="space-y-3 rounded-xl border border-border/50 bg-background/50 p-4">
                        <p className="text-sm font-medium text-foreground">Guest {index + 1}</p>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${index}`} className="text-xs font-medium">Full Name</Label>
                            <Input
                              id={`name-${index}`}
                              placeholder="Enter full name"
                              className="h-10 rounded-lg border-border/70 bg-background"
                              value={guestDetails[index]?.name ?? ""}
                              onChange={(e) => {
                                const updated = [...guestDetails]
                                if (!updated[index]) updated[index] = { name: "", age: "", contact: "", email: user?.email || "" }
                                updated[index].name = e.target.value
                                setGuestDetails(updated)
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`age-${index}`} className="text-xs font-medium">Age</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id={`age-${index}`}
                                placeholder="Enter age"
                                type="number"
                                min="1"
                                max="100"
                                className="h-10 rounded-lg border-border/70 bg-background"
                                value={guestDetails[index]?.age ?? ""}
                                onChange={(e) => {
                                  const updated = [...guestDetails]
                                  if (!updated[index]) updated[index] = { name: "", age: "", contact: "", email: user?.email || "" }
                                  updated[index].age = e.target.value
                                  setGuestDetails(updated)
                                }}
                              />
                              {guestDetails[index]?.age && Number(guestDetails[index]?.age) > 0 && Number(guestDetails[index]?.age) <= 5 && (
                                <span className="text-xs font-medium text-emerald-600 whitespace-nowrap">(child)</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`contact-${index}`} className="text-xs font-medium">Contact Number</Label>
                            {(() => {
                              const contactParts = splitContactNumber(guestDetails[index]?.contact ?? "")
                              const selectedCountry = COUNTRY_CODE_OPTIONS.find((option) => option.value === contactParts.countryCode) || COUNTRY_CODE_OPTIONS[0]
                              return (
                                <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-4">
                                  <select
                                    className="h-10 rounded-lg border border-border/70 bg-background px-2 py-2 text-center text-xs"
                                    value={contactParts.countryCode}
                                    title={selectedCountry.label}
                                    onChange={(e) => updateGuestContact(index, e.target.value, contactParts.localContactNumber)}
                                  >
                                    {COUNTRY_CODE_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>{option.value}</option>
                                    ))}
                                  </select>
                                  <Input
                                    id={`contact-${index}`}
                                    placeholder={`${selectedCountry.localLength}-digit number`}
                                    className="h-10 rounded-lg border-border/70 bg-background"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={selectedCountry.localLength}
                                    value={contactParts.localContactNumber}
                                    onChange={(e) => updateGuestContact(index, contactParts.countryCode, e.target.value)}
                                  />
                                </div>
                              )
                            })()}
                            <p className="text-xs text-muted-foreground">Select a country code and enter exactly 10 digits.</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-border/70 bg-secondary/45 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected stay</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatDisplayDate(checkIn)} to {formatDisplayDate(checkOut)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="mt-1 font-semibold text-foreground">{nights} night{nights !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="h-fit border-border/70 bg-card/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:sticky sm:top-28 sm:p-6">
            <div className="overflow-hidden rounded-2xl">
              <img
                src={checkoutState.image}
                alt={checkoutState.itemName}
                className="h-56 w-full object-cover"
              />
            </div>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Booking Summary</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">{checkoutState.itemName}</h2>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {checkoutState.location}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {nights} night{nights !== 1 ? "s" : ""} stay
              </p>
            </div>

            <div className="mt-6 space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-medium text-foreground">{formatDisplayDate(checkIn)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span className="font-medium text-foreground">{formatDisplayDate(checkOut)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span className="font-medium text-foreground">{guests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rate per night</span>
                <span className="font-medium text-foreground">{formatMoney(checkoutState.unitPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nights</span>
                <span className="font-medium text-foreground">{nights}</span>
              </div>
              <div className="border-t border-border/80 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-semibold text-foreground">{formatMoney(total)}</span>
                </div>
              </div>
            </div>

            <Button
              className="mt-6 h-12 w-full rounded-xl text-base"
              disabled={!checkIn || !checkOut}
              onClick={handleConfirm}
            >
              Confirm Reservation
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Your booking is confirmed instantly after submission.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
