# Invoice Download Feature - Code Examples & Reference

## 🔧 Developer Reference Guide

This document provides code examples and technical references for the invoice download feature.

---

## 📋 Property Booking - Code Examples

### 1. Invoice Generation Function

```typescript
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

  // HTML template with embedded styling
  const invoiceHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Invoice-${receiptDetails.bookingId}</title>
    <style>
      /* Professional invoice styling */
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #1f2937;
        margin: 0;
        padding: 20px;
      }
      /* ... more CSS ... */
    </style>
  </head>
  <body>
    <!-- Invoice content -->
  </body>
</html>`

  // Convert to Blob
  return new Blob([invoiceHtml], { type: "text/html" })
}
```

### 2. Download Invoice Function

```typescript
const downloadInvoicePdf = () => {
  try {
    // Generate invoice
    const blob = generateInvoicePdf()
    
    // Create object URL
    const url = URL.createObjectURL(blob)
    
    // Create download link
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `invoice-${receiptDetails?.bookingId}-${new Date().getFullYear()}.pdf`
    
    // Trigger download
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    
    // Cleanup
    URL.revokeObjectURL(url)
  } catch (error) {
    setSubmitError(error instanceof Error ? error.message : "Unable to download invoice")
  }
}
```

### 3. Preview/Print Function

```typescript
const downloadBillPdf = () => {
  if (!checkoutState || !receiptDetails) return
  
  const billWindow = window.open("", "_blank", "width=900,height=700")
  if (!billWindow) {
    setSubmitError("Unable to open the bill preview window.")
    return
  }

  try {
    // Generate invoice blob
    const blob = generateInvoicePdf()
    const url = URL.createObjectURL(blob)
    
    // Fetch and display
    const xhr = new XMLHttpRequest()
    xhr.open("GET", url, true)
    xhr.responseType = "blob"
    xhr.onload = () => {
      const reader = new FileReader()
      reader.onload = () => {
        billWindow.document.open()
        billWindow.document.write(reader.result as string)
        billWindow.document.close()
        billWindow.focus()
        billWindow.print()
        URL.revokeObjectURL(url)
      }
      reader.readAsText(xhr.response)
    }
    xhr.send()
  } catch (error) {
    setSubmitError(error instanceof Error ? error.message : "Unable to open preview")
  }
}
```

---

## 🎫 Tour Booking - Code Examples

### 1. Download Invoice Handler

```typescript
const handleInvoiceDownload = async () => {
  if (!confirmedBooking) return
  
  const token = AuthService.getToken()
  if (!token) {
    setErrors({ submit: 'Your session expired. Please sign in again.' })
    return
  }
  
  setDownloadBusy(true)
  try {
    // Fetch invoice from backend
    const blob = await tourBookingApi.downloadInvoice(token, confirmedBooking.bookingId)
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `invoice-${confirmedBooking.bookingId}.pdf`
    
    // Trigger download
    anchor.click()
    
    // Cleanup
    window.URL.revokeObjectURL(url)
  } catch (error) {
    setErrors({ submit: error instanceof Error ? error.message : 'Unable to download invoice.' })
  } finally {
    setDownloadBusy(false)
  }
}
```

### 2. Tour Booking API Call

```typescript
// In tourBookingApi.ts
downloadInvoice: async (token: string, bookingId: string) => {
  const response = await fetch(`${API_BASE}/tour-bookings/${bookingId}/invoice`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as ApiResponse<unknown> | null
    throw new Error(payload?.message || 'Unable to download invoice')
  }
  return response.blob()
}
```

---

## 📝 HTML Invoice Template Structure

### Property Invoice HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Invoice-12345</title>
    <style>
      /* All styling embedded */
      body { font-family: system-ui; color: #1f2937; }
      .header { border-bottom: 2px solid #1b6b4a; }
      .status-badge { background: #d1fae5; color: #065f46; }
      /* ... more styles ... */
    </style>
  </head>
  <body>
    <div class="wrap">
      <!-- Header -->
      <div class="header">
        <div class="brand">Jolly Retreats</div>
        <div class="invoice-type">Property Booking Invoice</div>
        <div class="invoice-details">
          <div>Invoice Number: INV-12345-2026</div>
          <div>Status: CONFIRMED</div>
        </div>
      </div>

      <!-- Guest & Booking Info -->
      <div class="guest-info">
        <div>Bill To: Guest Name</div>
        <div>Check-in: Jan 1, 2026</div>
      </div>

      <!-- Itemized Charges -->
      <table>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
        <tr>
          <td>Villa - Nightly Rate</td>
          <td>$500.00</td>
        </tr>
      </table>

      <!-- Total -->
      <div class=\"summary\">
        <div>Total Due: $500.00</div>
      </div>

      <!-- Footer -->
      <div class=\"footer\">
        <p>Thank you for booking with Jolly Retreats!</p>
      </div>
    </div>
  </body>
</html>
```

---

## 🎨 UI Components - JSX/TSX Examples

### Property Confirmation Page Layout

```jsx
if (isConfirmed) {
  return (
    <div className="min-h-screen bg-gradient">
      <Card className="max-w-2xl mx-auto">
        {/* Success Header */}
        <CheckCircle2 className="h-14 w-14 text-emerald-600" />
        <h1 className="font-serif text-3xl font-bold">Reservation Confirmed!</h1>
        <p className="text-muted-foreground">
          Your stay is confirmed. Booking Reference #: {receiptDetails?.bookingId}
        </p>

        {/* Summary Grid */}
        <div className="grid grid-cols-3 gap-3 bg-muted p-4 rounded-2xl">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Guests</p>
            <p className="font-semibold">{guests}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Dates</p>
            <p className="font-semibold">{formatDisplayDate(checkIn)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Total</p>
            <p className="font-semibold">{formatMoney(total)}</p>
          </div>
        </div>

        {/* Invoice Download Section */}
        <div className="border border-emerald-200 bg-emerald-50 p-4 rounded-xl">
          <p className="text-sm font-semibold text-emerald-900">
            📋 Download Your Invoice
          </p>
          <p className="text-sm text-emerald-800">
            Get your official invoice for this booking.
          </p>
          <Button 
            className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={downloadInvoicePdf}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Invoice PDF
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={downloadBillPdf}>
            <Download className="mr-2 h-4 w-4" />
            Preview & Print
          </Button>
          <Button variant="outline" onClick={downloadReceipt}>
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

### Tour Booking Confirmation (Step 4)

```jsx
{step === 4 && confirmedBooking && (
  <Card className="space-y-5 p-5">
    {/* Success Message */}
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
      <div>
        <h3 className="text-lg font-semibold">Booking Confirmed!</h3>
        <p className="text-sm text-muted-foreground">
          Your booking ID is {confirmedBooking.bookingId}
        </p>
      </div>
    </div>

    {/* Info Cards */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-muted/20 p-4 rounded-xl">
        <p className="font-medium">Primary Contact</p>
        <p className="text-muted-foreground">
          {confirmedBooking.primaryContactPerson}
        </p>
      </div>
      <div className="bg-muted/20 p-4 rounded-xl">
        <p className="font-medium">Grand Total</p>
        <p className="text-xl font-semibold">
          {formatMoney(confirmedBooking.totalAmount)}
        </p>
      </div>
    </div>

    {/* Invoice Download Section */}
    <div className="border border-emerald-200 bg-emerald-50 p-4 rounded-xl">
      <p className="text-sm font-semibold text-emerald-900">
        📋 Download Your Invoice
      </p>
      <p className="text-sm text-emerald-800">
        Get your official invoice for this tour booking.
      </p>
      <Button 
        className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
        onClick={handleInvoiceDownload}
        disabled={downloadBusy}
      >
        {downloadBusy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Download Invoice PDF
      </Button>
    </div>

    {/* Close Button */}
    <Button 
      variant="outline" 
      onClick={() => onOpenChange(false)}
      className="w-full"
    >
      Close
    </Button>
  </Card>
)}
```

---

## 🎯 TypeScript Interfaces

### Property Booking Types

```typescript
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

interface ReceiptDetails {
  bookingId: number
  bookingDate: string
  createdAt: string
  status: string
}
```

### Tour Booking Types

```typescript
interface TourBooking {
  bookingId: string
  tourId: number
  tourTitle: string
  tourDescription: string
  startDate: string
  endDate: string
  totalPeople: number
  pricePerPerson: number
  taxAmount: number
  totalAmount: number
  bookingStatus: 'pending' | 'confirmed' | 'cancelled'
  primaryContactPerson: string
  primaryContactPhone: string
  customerName: string
  customerEmail: string
  createdAt: string
  travelers: Array<{
    travelerId: number
    name: string
    age: number
    gender: 'Male' | 'Female' | 'Other'
    contactNumber: string
  }>
}
```

---

## 🔧 Utility Functions

### Format Money

```typescript
const formatMoney = (value: number) => `$${value.toFixed(2)}`

// Usage
formatMoney(500) // → "$500.00"
formatMoney(2500.5) // → "$2500.50"
```

### Format Display Date

```typescript
const formatDisplayDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : value

// Usage
formatDisplayDate("2026-01-15") // → "Jan 15, 2026"
```

### Format Date Label

```typescript
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

// Usage
formatDateLabel("2026-01-15") // → "Jan 15, 2026"
```

---

## 🔐 Authentication & Error Handling

### Check Authentication

```typescript
const token = AuthService.getToken()
if (!token) {
  setErrors({ submit: 'Your session expired. Please sign in again.' })
  return
}
```

### Error Handling Pattern

```typescript
try {
  // Attempt download
  const blob = await tourBookingApi.downloadInvoice(token, bookingId)
  // Process download
} catch (error) {
  // Catch and display error
  setErrors({
    submit: error instanceof Error 
      ? error.message 
      : 'Unable to download invoice.'
  })
} finally {
  // Cleanup
  setDownloadBusy(false)
}
```

---

## 📱 Responsive Design Classes

### Property Confirmation Layout

```jsx
<div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4 text-left sm:grid-cols-3">
  {/* Grid: 1 column on mobile, 3 on desktop */}
</div>

<div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row">
  {/* Stack vertically on mobile, horizontal on desktop */}
</div>

<Button className="mt-6 h-12 w-full rounded-xl text-base">
  {/* Full width on mobile, content width on desktop */}
</Button>
```

### Mobile-First Approach

```jsx
// Mobile first (applies to all)
className="text-sm"

// Then override for larger screens
className="text-sm sm:text-base md:text-lg lg:text-xl"

// Flexbox responsive
className="flex flex-col sm:flex-row"
// → Column on mobile, row on tablet+
```

---

## 🧪 Testing Code

### Test Property Invoice Download

```typescript
it('should download property invoice when button clicked', () => {
  render(<CheckoutPage />)
  
  // Set confirmed state
  const downloadButton = screen.getByText(/Download Invoice PDF/i)
  fireEvent.click(downloadButton)
  
  // Verify download was triggered
  expect(URL.createObjectURL).toHaveBeenCalled()
  expect(anchor.click).toHaveBeenCalled()
})
```

### Test Tour Invoice Download

```typescript
it('should download tour invoice when button clicked', async () => {
  render(<TourBookingFlow />)
  
  // Navigate to step 4
  // Mock API call
  mockTourBookingApi.downloadInvoice.mockResolvedValueOnce(
    new Blob(['PDF content'])
  )
  
  // Click download button
  const downloadButton = screen.getByText(/Download Invoice PDF/i)
  fireEvent.click(downloadButton)
  
  // Verify download was triggered
  await waitFor(() => {
    expect(downloadButton).not.toBeDisabled()
  })
})
```

---

## 🔄 Common Patterns

### Create and Download Blob

```typescript
// Create Blob
const blob = new Blob([content], { type: "text/html" })

// Create Object URL
const url = URL.createObjectURL(blob)

// Create anchor element
const anchor = document.createElement("a")
anchor.href = url
anchor.download = "filename.pdf"

// Trigger download
document.body.appendChild(anchor)
anchor.click()
anchor.remove()

// Cleanup
URL.revokeObjectURL(url)
```

### Handle Async Download

```typescript
const [downloadBusy, setDownloadBusy] = useState(false)

const handleDownload = async () => {
  setDownloadBusy(true)
  try {
    const blob = await fetchInvoice()
    downloadFile(blob, 'filename.pdf')
  } catch (error) {
    console.error(error)
  } finally {
    setDownloadBusy(false)
  }
}
```

### Display Loading State

```jsx
<Button onClick={handleDownload} disabled={downloadBusy}>
  {downloadBusy ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Downloading...
    </>
  ) : (
    <>
      <Download className="mr-2 h-4 w-4" />
      Download
    </>
  )}
</Button>
```

---

## 📊 Performance Tips

### Optimize Blob Creation

```typescript
// ✅ Good - Create Blob once
const blob = new Blob([html], { type: "text/html" })
const url = URL.createObjectURL(blob)

// ❌ Avoid - Multiple Blob creations
for (let i = 0; i < 10; i++) {
  new Blob([html]) // Inefficient
}
```

### Cleanup Resources

```typescript
// ✅ Good - Always cleanup
const url = URL.createObjectURL(blob)
try {
  // Use URL
} finally {
  URL.revokeObjectURL(url)
}

// ❌ Avoid - Memory leaks
const url = URL.createObjectURL(blob)
// Forget to revoke
```

### Async Operations

```typescript
// ✅ Good - Use async/await
const handleDownload = async () => {
  try {
    const blob = await fetchInvoice()
  } finally {
    setLoading(false)
  }
}

// ❌ Avoid - Not handling promise rejection
handleDownload() // No error handling
```

---

## 🎓 Additional Resources

### Browser APIs Used
- `Blob` - File-like object
- `URL.createObjectURL()` - Create download URL
- `fetch()` - API requests
- `XMLHttpRequest` - File operations
- `FileReader` - Read file contents

### External Libraries
- React - UI framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Lucide React - Icons
- Shadcn/ui - UI components

### Files to Review
1. `src/pages/main/checkout.tsx` - Property booking
2. `src/components/tours/tour-booking-flow.tsx` - Tour booking
3. `src/services/tourBookingApi.ts` - API calls
4. `src/services/authService.ts` - Authentication

---

## 📝 Notes for Future Developers

1. **Invoice Template**: Modify `generateInvoicePdf()` for custom invoices
2. **File Naming**: Update filename format in download functions
3. **Styling**: Edit CSS in HTML template for design changes
4. **Error Messages**: Customize user-facing error text
5. **UI Layout**: Adjust Tailwind classes for responsive changes

---

**End of Developer Reference Guide**

For more information, see the other documentation files.
