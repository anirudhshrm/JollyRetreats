# Invoice Download Feature - Visual Flow Guide

## 🎯 User Journey Map

### Property Booking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ PROPERTY BOOKING - INVOICE DOWNLOAD FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. BROWSE & SELECT
   ┌──────────────────────┐
   │ Browse Properties    │
   │ Click \"Reserve Now\"  │
   └──────────┬───────────┘
              ↓
   ┌──────────────────────┐
   │ Checkout Page        │
   │ Set dates & guests   │
   └──────────┬───────────┘
              ↓
2. CONFIRM RESERVATION
   ┌──────────────────────────┐
   │ Click \"Confirm          │
   │ Reservation\" button      │
   └──────────┬───────────────┘
              ↓
3. SERVER PROCESSING
   ┌──────────────────────────┐
   │ ✓ Create booking record  │
   │ ✓ Store booking details  │
   │ ✓ Confirm reservation    │
   └──────────┬───────────────┘
              ↓
4. CONFIRMATION PAGE APPEARS
   ┌─────────────────────────────────────────┐
   │ ✓ Reservation Confirmed!                │
   │                                         │
   │ Booking Reference #: 12345              │
   │ ┌─────────────────────────────────────┐ │
   │ │ Guests: 2 | Dates: Jan 1-5 | $500  │ │
   │ └─────────────────────────────────────┘ │
   │                                         │
   │ ┌─ INVOICE SECTION (Highlighted Green) │
   │ │ 📋 Download Your Invoice              │
   │ │ [Download Invoice PDF Button]────┐   │
   │ └─────────────────────────────────│───┘ │
   │                                    │     │
   │ [Preview & Print] [Receipt] [Exit]│     │
   └────────────────────────────┬───────┘     │
                                │             │
5. USER CLICKS INVOICE BUTTON  │             
   ─────────────────────────────┘             
              ↓
   ┌──────────────────────────────────────────┐
   │ generateInvoicePdf() executes             │
   │ ✓ Creates HTML invoice template           │
   │ ✓ Populates with booking data             │
   │ ✓ Applies professional styling            │
   │ ✓ Returns Blob object                     │
   └──────────┬───────────────────────────────┘
              ↓
6. DOWNLOAD TRIGGERED
   ┌──────────────────────────────────────────┐
   │ downloadInvoicePdf() executes             │
   │ ✓ Creates object URL from Blob            │
   │ ✓ Creates anchor element                  │
   │ ✓ Triggers browser download               │
   │ ✓ Cleans up resources                     │
   └──────────┬───────────────────────────────┘
              ↓
7. FILE SAVED
   ┌──────────────────────────────────────────┐
   │ Browser's download manager                │
   │                                           │
   │ 📥 invoice-12345-2026.pdf                │
   │    [Save] [Cancel]                       │
   └──────────┬───────────────────────────────┘
              ↓
   ✅ FILE DOWNLOADED TO USER'S DEVICE
      Location: Downloads folder
      Name: invoice-12345-2026.pdf
      Status: Ready to use
```

---

### Tour Booking Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ TOUR BOOKING - INVOICE DOWNLOAD FLOW                              │
└──────────────────────────────────────────────────────────────────┘

1. BROWSE & SELECT
   ┌──────────────────────┐
   │ Browse Tours         │
   │ Click \"Book Now\"    │
   └──────────┬───────────┘
              ↓
2. BOOKING DIALOG OPENS - STEP 1
   ┌──────────────────────────┐
   │ Travelers & Dates         │
   │ Enter: # people, dates    │
   │ [Continue →]              │
   └──────────┬───────────────┘
              ↓
3. STEP 2: TRAVELER DETAILS
   ┌──────────────────────────────┐
   │ Enter traveler information    │
   │ Name, Age, Gender, Email, etc │
   │ [Continue →]                  │
   └──────────┬───────────────────┘
              ↓
4. STEP 3: REVIEW SUMMARY
   ┌─────────────────────────────┐
   │ Review booking details       │
   │ Price: $2,500.00            │
   │ [Confirm Booking] [← Back]   │
   └──────────┬──────────────────┘
              ↓
5. CONFIRM BOOKING
   ┌────────────────────────────┐
   │ Click \"Confirm Booking\"    │
   │ button                       │
   └──────────┬─────────────────┘
              ↓
6. SERVER PROCESSING
   ┌────────────────────────────────┐
   │ Backend API:                     │
   │ ✓ Create booking record          │
   │ ✓ Generate invoice PDF           │
   │ ✓ Assign booking ID              │
   │ ✓ Send confirmation              │
   └──────────┬─────────────────────┘
              ↓
7. STEP 4: CONFIRMATION PAGE
   ┌───────────────────────────────────┐
   │ ✓ Booking Confirmed!              │
   │                                   │
   │ Booking ID: TOB-2026-001          │
   │ Contact: John Doe | $2,500.00    │
   │                                   │
   │ ┌─ INVOICE SECTION (Highlighted)  │
   │ │ 📋 Download Your Invoice         │
   │ │ [Download Invoice PDF Button]──┐ │
   │ └────────────────────────────────┤ │
   │ [Close]                           │ │
   └──────────────────────┬────────────┘ │
                          │ (STEP 4)      │
8. USER CLICKS INVOICE BUTTON
   ─────────────────────────────────────┘
              ↓
   ┌──────────────────────────────────────┐
   │ handleInvoiceDownload() executes      │
   │                                      │
   │ ⏳ Loading spinner shows             │
   │ setDownloadBusy(true)                │
   │                                      │
   │ ✓ Validate auth token               │
   │ ✓ Fetch PDF from backend API        │
   │ ✓ Create blob from response         │
   │ ✓ Create download link              │
   │ ✓ Trigger download                  │
   │ ✓ Clean up resources                │
   │ ✓ Hide loading spinner              │
   │ setDownloadBusy(false)              │
   └──────────┬───────────────────────────┘
              ↓
9. FILE SAVING
   ┌──────────────────────────────────────┐
   │ Browser downloads file               │
   │                                      │
   │ 📥 invoice-TOB-2026-001.pdf         │
   │    [Save] [Cancel]                  │
   └──────────┬───────────────────────────┘
              ↓
   ✅ FILE DOWNLOADED TO USER'S DEVICE
      Location: Downloads folder
      Name: invoice-TOB-2026-001.pdf
      Status: Ready to use
```

---

## 🔄 Invoice Download Process (Detailed)

### Property Booking - Generation Flow

```
┌─ Property Booking Data ─┐
│ • bookingId: 12345      │
│ • property: Villa       │
│ • checkIn: 2026-01-01   │
│ • checkOut: 2026-01-05  │
│ • guests: 2             │
│ • total: $500           │
└─────────┬───────────────┘
          ↓
    generateInvoicePdf()
    ┌──────────────────────────────────┐
    │ HTML Template + Data              │
    │                                  │
    │ <html>                            │
    │   <head>                          │
    │     • Invoice title               │
    │     • Styling (CSS)               │
    │   </head>                         │
    │   <body>                          │
    │     • Header (logo, invoice #)    │
    │     • Guest info                  │
    │     • Property details            │
    │     • Charges table               │
    │     • Total section               │
    │     • Footer                      │
    │   </body>                         │
    │ </html>                           │
    └──────────┬───────────────────────┘
               ↓
    Convert to Blob
    ┌──────────────────────────────────┐
    │ new Blob([invoiceHtml],           │
    │   {type: \"text/html\"})           │
    │                                  │
    │ Result: Blob object              │
    │ • Size: ~5-10KB                  │
    │ • Type: text/html                │
    │ • Content: HTML with styling     │
    └──────────┬───────────────────────┘
               ↓
    URL.createObjectURL()
    ┌──────────────────────────────────┐
    │ blob:https://domain/xxxxx...      │
    │                                  │
    │ Browser-specific blob URL        │
    └──────────┬───────────────────────┘
               ↓
    Create Download Link
    ┌──────────────────────────────────┐
    │ <a href=\"blob:...\"               │
    │    download=\"invoice-12345.pdf\"> │
    │                                  │
    │ anchor element                   │
    └──────────┬───────────────────────┘
               ↓
    Trigger Download
    ┌──────────────────────────────────┐
    │ anchor.click()                   │
    │                                  │
    │ Browser downloads file           │
    └──────────┬───────────────────────┘
               ↓
    Cleanup
    ┌──────────────────────────────────┐
    │ • Remove anchor element          │
    │ • Revoke object URL              │
    │ • Free memory                    │
    └──────────┬───────────────────────┘
               ↓
    ✅ File saved to Downloads
```

### Tour Booking - Fetch & Download Flow

```
┌─ Tour Booking Confirmed ─┐
│ bookingId: TOB-2026-001   │
│ tourId: 5                 │
└─────────┬─────────────────┘
          ↓
    handleInvoiceDownload()
    ┌────────────────────────────┐
    │ Show loading spinner        │
    │ setDownloadBusy(true)       │
    │                            │
    │ Get auth token             │
    │ token = AuthService...     │
    │                            │
    │ Validate token exists      │
    │ if (!token) error          │
    └──────────┬─────────────────┘
               ↓
    API Request to Backend
    ┌──────────────────────────────────────┐
    │ GET /tour-bookings/{id}/invoice      │
    │                                      │
    │ Headers:                             │
    │ • Authorization: Bearer {token}     │
    │ • Content-Type: application/pdf     │
    │                                      │
    │ Backend:                             │
    │ ✓ Verify booking exists             │
    │ ✓ Generate PDF                      │
    │ ✓ Return PDF file                   │
    └──────────┬───────────────────────────┘
               ↓
    Response Processing
    ┌──────────────────────────────────────┐
    │ response.blob()                      │
    │                                      │
    │ Convert response to Blob             │
    │ Type: application/pdf                │
    │ Size: ~20-50KB (typical)             │
    └──────────┬───────────────────────────┘
               ↓
    Create Download Link
    ┌──────────────────────────────────────┐
    │ window.URL.createObjectURL(blob)     │
    │                                      │
    │ Generate: blob:https://domain/xxx   │
    │ Type: application/pdf               │
    └──────────┬───────────────────────────┘
               ↓
    Create Anchor Element
    ┌──────────────────────────────────────┐
    │ <a href=\"blob:...\"                  │
    │    download=\"invoice-TOB-2026.pdf\"> │
    │                                      │
    │ Set download filename                │
    │ Format: invoice-{bookingId}.pdf      │
    └──────────┬───────────────────────────┘
               ↓
    Trigger Download
    ┌──────────────────────────────────────┐
    │ anchor.click()                       │
    │                                      │
    │ Browser download manager handles     │
    │ File saves to Downloads folder       │
    └──────────┬───────────────────────────┘
               ↓
    Cleanup & Hide Loading
    ┌──────────────────────────────────────┐
    │ • Remove anchor element              │
    │ • Revoke object URL                  │
    │ • setDownloadBusy(false)             │
    │ • Hide loading spinner               │
    └──────────┬───────────────────────────┘
               ↓
    Error Handling (if any)
    ┌──────────────────────────────────────┐
    │ catch (error)                        │
    │ • Show error message                 │
    │ • setErrors({...})                   │
    │ • User can try again                 │
    └──────────┬───────────────────────────┘
               ↓
    ✅ File saved to Downloads
```

---

## 📊 State Management Flow

### Property Booking Component State

```
checkout.tsx State Variables
├── isConfirmed: boolean
│   ├── false: Show checkout form
│   └── true: Show confirmation page with download
├── receiptDetails: ReceiptDetails | null
│   ├── bookingId: number
│   ├── bookingDate: string
│   ├── createdAt: string
│   └── status: string
├── submitError: string
│   └── Error messages for user
└── receiptDetails populated:
    ✓ Download buttons enabled
    ✓ Invoice data available
    ✓ User can download
```

### Tour Booking Component State

```
tour-booking-flow.tsx State Variables
├── step: number (1-4)
│   ├── 1: Travelers & Dates
│   ├── 2: Traveler Details
│   ├── 3: Summary Review
│   └── 4: Confirmation & Download
├── confirmedBooking: TourBooking | null
│   ├── bookingId: string
│   ├── totalAmount: number
│   ├── primaryContactPerson: string
│   └── ...other booking details
├── downloadBusy: boolean
│   ├── true: Show loading spinner
│   └── false: Show ready state
└── errors: Record<string, string>
    └── Display to user
```

---

## 🎨 UI Component Hierarchy

### Property Checkout Confirmation

```
Confirmation Container
└── Card (max-w-2xl)
    ├── Success Message Section
    │   ├── CheckCircle2 Icon (emerald-600)
    │   ├── Heading: "Reservation Confirmed!"
    │   └── Subtext with property details
    │
    ├── Summary Grid Section
    │   ├── Column 1: Guests count
    │   ├── Column 2: Check-in to Check-out dates
    │   └── Column 3: Total price
    │
    ├── Download Section (GREEN HIGHLIGHT)
    │   ├── Border: emerald-200
    │   ├── Background: emerald-50
    │   ├── Label: \"📋 Download Your Invoice\"
    │   ├── Description text
    │   └── Button: Full-width, bg-emerald-600
    │
    ├── Additional Options Section
    │   ├── Row 1:
    │   │   ├── \"Preview & Print\" button
    │   │   └── \"Download Receipt\" button
    │   │
    │   └── Row 2:
    │       ├── \"Explore More\" button
    │       └── \"Go to Dashboard\" button
    │
    └── Action Buttons
        ├── Variant: outline/primary
        ├── Full-width on mobile
        └── Row layout on desktop
```

### Tour Booking Confirmation (Step 4)

```
Confirmation Card
├── Success Section
│   ├── CheckCircle2 Icon
│   ├── \"Booking Confirmed!\" title
│   └── Booking ID and message
│
├── Information Cards
│   ├── Primary Contact info
│   └── Grand Total amount
│
├── Error Message (if any)
│   └── Display errors
│
├── Download Section (GREEN HIGHLIGHT)
│   ├── Border: emerald-200
│   ├── Background: emerald-50
│   ├── Label: \"📋 Download Your Invoice\"
│   ├── Description text
│   └── Button: Full-width, bg-emerald-600
│       └── Loading spinner or Download icon
│
└── Close Button
    └── Full-width, variant: outline
```

---

## 🔐 Data Security & Validation Flow

```
User initiates download
        ↓
┌─────────────────────────────────┐
│ 1. Authentication Check         │
│ • Get auth token                │
│ • Validate token exists         │
│ • Verify not expired            │
│ ✓ Pass → continue              │
│ ✗ Fail → show error            │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 2. Data Validation              │
│ • Check booking exists          │
│ • Verify booking details        │
│ • Validate user permissions     │
│ ✓ Pass → continue              │
│ ✗ Fail → show error            │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 3. Generate/Fetch Invoice       │
│ • Create invoice data           │
│ • Apply formatting              │
│ • Generate file                 │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ 4. Trigger Download             │
│ • Create download link          │
│ • Start browser download        │
│ • Clean up resources            │
└────────────┬────────────────────┘
             ↓
✅ User receives file
   in Downloads folder
```

---

## 📈 Success Indicators

### User Actions That Show Success

```
✅ File appears in Downloads folder
   └── Filename: invoice-{id}-{year}.pdf

✅ Browser download notification shows
   └── File name and download progress

✅ File size is reasonable
   └── 5-50KB depending on content

✅ File opens without errors
   └── PDF reader opens invoice

✅ Invoice displays all information
   └── Dates, amounts, details correct

✅ Print works correctly
   └── Layout preserved in print preview

✅ Share functionality works
   └── Can email or send file
```

---

## 🔄 Error States & Recovery

```
Error Scenario 1: No Authentication
├── Show: "Your session expired"
├── Action: Prompt to log in again
└── Recovery: Re-authenticate and retry

Error Scenario 2: Booking Not Found
├── Show: "Unable to find booking"
├── Action: Go back to dashboard
└── Recovery: Select booking again

Error Scenario 3: Download Failed
├── Show: "Unable to download invoice"
├── Action: Show retry button
└── Recovery: Try download again

Error Scenario 4: Network Error
├── Show: "Connection error"
├── Action: Check internet connection
└── Recovery: Retry when connected

All Errors:
├── Clear, user-friendly message
├── Don't expose technical details
├── Provide action to resolve
└── Allow retry without page reload
```

---

This visual guide shows the complete flow and structure of the invoice download feature!
