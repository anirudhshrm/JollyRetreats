# 📧 Email Sending Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                     JOLLY RETREATS EMAIL SYSTEM                              │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│    FRONTEND                │         │    BACKEND                │
│                            │         │                          │
│  User Interface            │         │  API Routes & Logic       │
│                            │         │                          │
├──────────────────────────┤         ├──────────────────────────┤
│                            │         │                          │
│  1. Property Booking       │         │  1. Routes               │
│     checkout.tsx           │         │     /bookings            │
│                            │         │     /tour-bookings       │
│  2. Tour Booking           │         │                          │
│     tour-booking-flow.tsx  │         │  2. Database             │
│                            │         │     Store booking        │
│  3. Service Booking        │         │                          │
│     service-booking.tsx    │         │  3. Mailer Config        │
│                            │         │     /config/mailer.js    │
├──────────────────────────┤         ├──────────────────────────┤
│                            │         │                          │
│  Actions:                  │         │  Actions:                │
│  • Collect user email      │━━━━━━━━>  • Create booking         │
│  • Validate form           │  POST   │  • Extract email         │
│  • Send POST request       │  with   │  • Generate PDF          │
│  • Show confirmation       │  email  │  • Send email            │
│                            │         │  • Return success        │
└──────────────────────────┘         └──────────────────────────┘
                                                │
                                                │ Email with
                                                │ PDF & details
                                                ▼
                          ┌─────────────────────────────────┐
                          │   Gmail SMTP Server              │
                          │   smtp.gmail.com:587 (TLS)       │
                          │                                   │
                          │   From: admin@jollyretreats      │
                          │   Auth: App Password             │
                          └──────────┬──────────────────────┘
                                     │
                                     │ Email transmission
                                     │
                          ┌──────────▼────────────────────────┐
                          │   User Email Inbox                 │
                          │                                     │
                          │   📧 Booking Confirmation          │
                          │   • Booking ID                     │
                          │   • Details                        │
                          │   • 📎 Invoice PDF                 │
                          └──────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE EMAIL FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: USER INTERACTION
┌─────────────────────────────┐
│ User Fills Booking Form     │
│ • Dates                     │
│ • Guests                    │
│ • Details                   │
│ Email: AUTO-FILLED from user account
└────────────┬────────────────┘
             │
             │ User clicks
             │ "Confirm Reservation"
             ▼

STEP 2: FRONTEND PROCESSING
┌─────────────────────────────────────────────┐
│ frontend/checkout.tsx or booking-flow.tsx   │
├─────────────────────────────────────────────┤
│ • Validate all input                        │
│ • Prepare request payload:                  │
│   {                                         │
│     serviceType: "property",                │
│     serviceId: 45,                          │
│     bookingDate: "2026-05-20",              │
│     guestDetails: [{                        │
│       name: "John",                         │
│       email: "john@email.com" ✅ KEY!       │
│     }]                                      │
│   }                                         │
│ • Send POST request                         │
└────────────┬────────────────────────────────┘
             │
             │ HTTP POST
             │ /api/bookings
             ▼

STEP 3: BACKEND ROUTING
┌────────────────────────────────────────────────┐
│ server/routes/bookings.js or tourBookings.js   │
├────────────────────────────────────────────────┤
│ POST / (Create Booking)                        │
│ • Validate auth token                          │
│ • Validate input data                          │
│ • Extract email from request:                  │
│   const primaryEmail = traveler?.email         │
│                    || req.user.email           │
│                    || ''                       │
└────────────┬─────────────────────────────────┬┘
             │                                  │
             ▼                                  ▼

STEP 4: DATABASE & PDF
┌──────────────────────────┐     ┌──────────────────────────┐
│ Database Store           │     │ PDF Generation           │
├──────────────────────────┤     ├──────────────────────────┤
│ • Create booking record  │     │ • Build invoice object   │
│ • Save to database       │     │ • Generate PDF buffer    │
│ • Return booking ID      │     │ • Create attachment      │
└────────────┬─────────────┘     └────────────┬─────────────┘
             │                                 │
             └────────────┬────────────────────┘
                          │
                          ▼

STEP 5: EMAIL SENDING
┌────────────────────────────────────────────────────────────┐
│ server/config/mailer.js                                    │
│ sendCustomEmailToTraveler() or sendBookingConfirmation()  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Extract Email: john@email.com ✅                            │
│ Create Template:                                           │
│   ├─ Greeting with name                                   │
│   ├─ Booking details                                      │
│   ├─ Guest list                                           │
│   ├─ Pricing                                              │
│   ├─ Next steps                                           │
│   └─ Professional HTML formatting                         │
│                                                             │
│ Create Attachment:                                         │
│   └─ invoice-[BOOKING_ID].pdf                             │
│                                                             │
│ Send Email:                                                │
│   ├─ From: anirudhshrm009@gmail.com                        │
│   ├─ To: john@email.com ✅                                 │
│   ├─ Subject: 🎉 Booking Confirmation                     │
│   ├─ Body: HTML email content                             │
│   └─ Attachments: [PDF invoice]                           │
│                                                             │
└────────────┬─────────────────────────────────────────────┘
             │
             │ Email object prepared
             │
             ▼

STEP 6: SMTP TRANSMISSION
┌────────────────────────────────────────────────────────────┐
│ Gmail SMTP Server                                          │
│ (smtp.gmail.com:587 - TLS)                                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Nodemailer connects to Gmail                               │
│ • Use EMAIL_USER credentials                               │
│ • Use EMAIL_PASSWORD (App Password)                        │
│ • Establish secure TLS connection                          │
│ • Transmit email data                                      │
│ • Receive confirmation: 250 2.0.0 OK                       │
│                                                             │
│ Gmail processes email:                                     │
│ • Validates sender                                         │
│ • Scans for spam                                           │
│ • Queues for delivery                                      │
│                                                             │
└────────────┬─────────────────────────────────────────────┘
             │
             │ Email in flight
             │
             ▼

STEP 7: BACKEND RESPONSE
┌────────────────────────────────────────────┐
│ Backend Response (Non-blocking)            │
├────────────────────────────────────────────┤
│ • Email sending started in background      │
│ • Return 201 Created to frontend:          │
│   {                                        │
│     success: true,                         │
│     data: {                                │
│       id: 12345,                           │
│       bookingId: "BK-123456",              │
│       status: "confirmed"                  │
│     }                                      │
│   }                                        │
│                                            │
│ Note: Email continues sending in           │
│ background - doesn't block response        │
└────────────┬───────────────────────────────┘
             │
             │ HTTP 201 + JSON
             │
             ▼

STEP 8: FRONTEND CONFIRMATION
┌────────────────────────────────────────────┐
│ Frontend Shows Success                     │
├────────────────────────────────────────────┤
│                                            │
│  ╔═══════════════════════════════════╗   │
│  ║ ✅ Confirm Reservation             ║   │
│  ║                                     ║   │
│  ║ Booking ID: BK-123456              ║   │
│  ║ Status: Confirmed ✅               ║   │
│  ║                                     ║   │
│  ║ 📧 Email sent to: john@email.com   ║   │
│  ║                                     ║   │
│  ║ 📥 Download Invoice                ║   │
│  ║                                     ║   │
│  ╚═══════════════════════════════════╝   │
│                                            │
└────────────┬───────────────────────────────┘
             │
             │ User sees confirmation
             │

STEP 9: EMAIL DELIVERY
┌────────────────────────────────────────────────────────────┐
│ Gmail Processes Email (1-2 minutes later)                   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ gmail.com routing:                                         │
│ ✅ Validate recipient                                      │
│ ✅ Virus/spam scan                                         │
│ ✅ Store in user inbox or promotions folder                │
│                                                             │
└────────────┬─────────────────────────────────────────────┘
             │
             │ Email delivered
             │
             ▼

STEP 10: USER RECEIVES EMAIL
┌────────────────────────────────────────────────────────────┐
│ User Email Inbox                                           │
│ inbox: john@gmail.com                                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ From: Jolly Retreats <anirudhshrm009@gmail.com>           │
│ Subject: 🎉 Booking Confirmation - Paradise Tour          │
│ Date: May 19, 2026, 3:45 PM                               │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                       │ │
│ │  🎉 Booking Confirmation                            │ │
│ │  Your tour booking has been confirmed!              │ │
│ │                                                       │ │
│ │  Dear John Doe,                                     │ │
│ │  Thank you for booking with Jolly Retreats!         │ │
│ │                                                       │ │
│ │  📋 Tour Details:                                    │ │
│ │  • Booking ID: BK-123456                            │ │
│ │  • Tour: Paradise Island Adventure                  │ │
│ │  • Dates: May 20-25, 2026                           │ │
│ │  • Travelers: 2 people                              │ │
│ │  • Total: $3,300                                    │ │
│ │                                                       │ │
│ │  👥 Travelers:                                       │ │
│ │  1. John Doe (Age 30, Male)                         │ │
│ │  2. Jane Doe (Age 28, Female)                       │ │
│ │                                                       │ │
│ │  📎 Attachments (1):                                 │ │
│ │  └─ invoice-BK-123456.pdf                           │ │
│ │                                                       │ │
│ │  Next Steps:                                         │ │
│ │  1. Review your booking details                     │ │
│ │  2. Download and save the invoice                   │ │
│ │  3. Prepare for your tour                           │ │
│ │  4. Contact us with any questions                   │ │
│ │                                                       │ │
│ │  Best regards,                                       │ │
│ │  Jolly Retreats Team                                │ │
│ │                                                       │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                             │
│ ✅ User receives complete booking confirmation             │
│ ✅ User can download invoice PDF                           │
│ ✅ User has all booking information                        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Component Integration Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEM COMPONENTS                           │
└─────────────────────────────────────────────────────────────────┘

FRONTEND COMPONENTS
│
├─ src/pages/main/checkout.tsx
│  ├─ Captures: email (from user account)
│  ├─ Sends: POST to /api/bookings
│  ├─ Payload: guestDetails with email
│  └─ Result: confirmation page
│
├─ src/components/tours/tour-booking-flow.tsx
│  ├─ Captures: traveler email from form
│  ├─ Sends: POST to /api/tour-bookings
│  ├─ Payload: travelers array with email
│  └─ Result: confirmation page with PDF download
│
└─ src/components/services/service-booking-flow.tsx
   ├─ Captures: traveler email from form
   ├─ Sends: POST to /api/services/bookings
   ├─ Payload: travelers with email
   └─ Result: confirmation page
   
BACKEND COMPONENTS
│
├─ server/routes/bookings.js
│  ├─ Receives: POST /bookings with guestDetails
│  ├─ Creates: booking in database
│  ├─ Calls: sendCustomEmailToTraveler()
│  └─ Email to: primaryTraveler.email
│
├─ server/routes/tourBookings.js
│  ├─ Receives: POST /tour-bookings with travelers
│  ├─ Creates: booking in database
│  ├─ Calls: sendBookingConfirmationEmail()
│  └─ Email to: travelers[0].email
│
├─ server/config/mailer.js
│  ├─ Creates: Gmail SMTP transporter
│  ├─ Function: sendCustomEmailToTraveler()
│  ├─ Function: sendBookingConfirmationEmail()
│  └─ Function: createInvoiceAttachment()
│
├─ server/utils/pdfInvoice.js
│  └─ Generates: Invoice PDF from booking data
│
├─ server/test-nodemailer.js
│  └─ Tests: SMTP connection & email sending
│
└─ .env (Environment Variables)
   ├─ EMAIL_USER: anirudhshrm009@gmail.com
   └─ EMAIL_PASSWORD: App Password from Gmail

EXTERNAL SERVICES
│
└─ Gmail SMTP Server
   ├─ Host: smtp.gmail.com
   ├─ Port: 587 (TLS)
   ├─ Auth: EMAIL_USER + EMAIL_PASSWORD
   └─ Result: Email delivery to inbox
```

---

## Function Call Chain

```
User clicks "Confirm"
    ↓
handleConfirm() in frontend component
    ↓
Prepare POST request with email
    ↓
POST /api/bookings or /api/tour-bookings
    ↓
Backend route handler (requireAuth, requireUser)
    ↓
Validate input data
    ↓
Create booking in database
    ↓
Extract email from request
    ↓
Call sendCustomEmailToTraveler() or sendBookingConfirmationEmail()
    ├─ Extract email recipient
    ├─ Build HTML template
    ├─ Generate invoice PDF
    ├─ Create email object
    └─ Call transporter.sendMail()
        ↓
    Connect to Gmail SMTP
    Authenticate with credentials
    Transmit email (non-blocking)
        ↓
    Return: Response to frontend
    
Frontend receives 201 Created
    ↓
Show confirmation page
    ↓
(Email continues sending in background)
    ↓
Gmail receives email
    ↓
Processes and delivers to inbox (1-2 min)
    ↓
User receives confirmation email ✅
```

---

## Error Handling Flow

```
Email Sending Triggered
    ↓
TRY
    ├─ Validate email address ✅
    ├─ Create email template ✅
    ├─ Generate PDF ✅ or ⚠️ (non-critical)
    ├─ Connect to SMTP ✅
    └─ Send email ✅
        ↓
        SUCCESS ✅
        Log: ✅ Email sent to user@email.com
        Continue: Non-blocking return
        Result: Email in background
        
    OR

    CATCH
    └─ Email error occurs ❌
        ├─ Log: ❌ Error sending email: [error]
        ├─ Non-blocking: Continue anyway
        ├─ Booking: Already created ✅
        └─ User: Still gets confirmation page ✅
            (Email may retry or fail gracefully)

Response
    ├─ Booking always created ✅
    ├─ Confirmation page always shown ✅
    ├─ Email sent in background 📧
    └─ Failure doesn't affect user experience
```

---

## Status Summary

```
┌────────────────────────────────────────────┐
│  EMAIL SENDING IMPLEMENTATION              │
├────────────────────────────────────────────┤
│                                            │
│  Architecture:  ✅ Complete                │
│  Frontend:      ✅ Email captured          │
│  Backend:       ✅ Email sending           │
│  SMTP:          ✅ Gmail configured        │
│  PDF:           ✅ Invoice generation      │
│  Template:      ✅ Professional HTML       │
│  Error Handle:  ✅ Non-blocking            │
│  Testing:       ✅ All tests passed        │
│  Logging:       ✅ Comprehensive           │
│  Integration:   ✅ All booking types       │
│                                            │
│  OVERALL: ✅ PRODUCTION READY              │
│                                            │
└────────────────────────────────────────────┘
```

---

**Architecture Diagram Created:** May 19, 2026  
**Implementation Status:** ✅ Complete & Verified  
**Deployment Ready:** ✅ Yes
