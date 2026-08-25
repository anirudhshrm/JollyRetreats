# Reservation → Email Confirmation Flow

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROPERTY/TOUR BOOKING FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 1: USER INITIATES BOOKING                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Property Detail Page                  Tour Detail Page              │
│  ┌────────────────────┐               ┌────────────────────┐        │
│  │ "Book Stay"        │               │ "Book Tour"        │        │
│  └────────────────────┘               └────────────────────┘        │
│           │                                    │                     │
│           └────────────────┬───────────────────┘                    │
│                            ▼                                         │
│                    Opens Booking Dialog                              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 2: USER FILLS IN DETAILS                                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  PROPERTY BOOKINGS:           │  TOUR BOOKINGS:                      │
│  ├─ Check-in date             │  ├─ Start date                       │
│  ├─ Check-out date            │  ├─ End date                         │
│  ├─ Number of guests          │  ├─ Number of travelers              │
│  ├─ Guest details (name, age) │  ├─ Traveler details:                │
│  └─ Email (auto-filled)       │  │  ├─ Name                          │
│                               │  │  ├─ Age                           │
│                               │  │  ├─ Gender                        │
│                               │  │  ├─ Contact number                │
│                               │  │  └─ Email ✅ IMPORTANT!           │
│                               │  └─ Contact information              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 3: USER CLICKS "CONFIRM RESERVATION/BOOKING" 🎯                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Button: "Confirm Reservation" / "Confirm Booking"         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                            ▼                                         │
│  Data collected with email address                                   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 4: FRONTEND SENDS REQUEST TO BACKEND                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POST /api/bookings               │  POST /api/tour-bookings        │
│  OR                               │  OR                              │
│  POST /api/services/bookings      │  POST /api/reservations         │
│                                   │                                  │
│  Headers:                         │  Headers:                        │
│  ├─ Authorization: Bearer TOKEN   │  ├─ Authorization: Bearer TOKEN  │
│  └─ Content-Type: application/json│  └─ Content-Type: application/json
│                                   │                                  │
│  Body:                            │  Body:                           │
│  {                                │  {                               │
│    serviceType: "property",       │    tourId: 123,                  │
│    serviceId: 45,                 │    startDate: "2026-05-20",      │
│    bookingDate: "2026-05-20",     │    endDate: "2026-05-25",        │
│    dropoffDate: "2026-05-22",     │    totalPeople: 2,               │
│    bookingCount: 2,               │    travelers: [                  │
│    status: "confirmed",           │      {                           │
│    guestDetails: [                │        name: "John Doe",         │
│      {                            │        age: 30,                  │
│        name: "John Doe",          │        gender: "Male",           │
│        age: 30,                   │        contact: "+1234567890",   │
│        contact: "+1234567890",    │        email: "john@email.com"   │
│        email: "john@email.com" ✅ │      },                          │
│      }                            │      {...}                       │
│    ]                              │    ]                             │
│  }                                │  }                               │
│                                   │                                  │
│                 ▼  ▼  ▼                                              │
│         Request sent to backend                                      │
│                                   │                                  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 5: BACKEND CREATES BOOKING IN DATABASE                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Route Handler:                   │  Route Handler:                  │
│  /server/routes/bookings.js       │  /server/routes/tourBookings.js │
│                                   │                                  │
│  ├─ Validate all input data       │  ├─ Validate all input data      │
│  ├─ Check permissions             │  ├─ Check permissions           │
│  ├─ Create booking in database    │  ├─ Create booking in database  │
│  └─ Extract email address ✅      │  └─ Extract email address ✅    │
│                                   │                                  │
│                 ▼  ▼  ▼                                              │
│         Booking created! ✅                                          │
│                                   │                                  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 6: BACKEND TRIGGERS EMAIL SENDING ⚡                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  if (booking && emailTravelers && Array.isArray(emailTravelers)) {  │
│    const primaryEmail = emailTravelers[0]?.email                    │
│    if (primaryEmail && primaryEmail.trim()) {                       │
│      ✅ Extract email                                                │
│      ✅ Generate PDF invoice                                         │
│      ✅ Call sendCustomEmailToTraveler() / sendBookingConfirmation  │
│    }                                                                 │
│  }                                                                   │
│                                                                       │
│  Config: /server/config/mailer.js                                   │
│  - Service: Gmail                                                    │
│  - SMTP Server: smtp.gmail.com                                       │
│  - Port: 587 (TLS)                                                   │
│  - From: anirudhshrm009@gmail.com                                    │
│                                                                       │
│                 ▼  ▼  ▼                                              │
│         Sending email to recipient...                                │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 7: EMAIL SENT VIA GMAIL SMTP ✉️                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ✅ Email sent successfully!                                         │
│  ✅ Message ID: <42d7f14f-a5aa-05f8-59cb-28489f84a925@gmail.com>   │
│  ✅ Status: 250 2.0.0 OK                                            │
│                                                                       │
│  Email Details:                                                      │
│  ├─ To: john@email.com (or traveler's email)                        │
│  ├─ Subject: 🎉 Booking Confirmation - [Booking ID]                │
│  ├─ Content: Professional HTML template                             │
│  └─ Attachments:                                                     │
│     └─ invoice-[BOOKING_ID].pdf ✅                                   │
│                                                                       │
│  Backend logs:                                                       │
│  ✅ Email sent to john@email.com                                     │
│  ✅ Invoice PDF generated                                            │
│                                                                       │
│                 ▼  ▼  ▼                                              │
│         Email routed through Gmail                                   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 8: USER RECEIVES EMAIL 📬                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Inbox: john@email.com                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 🎉 Booking Confirmation - BK-1234567890                   5m  │ │
│  │                                                                │ │
│  │ Dear John Doe,                                                 │ │
│  │                                                                │ │
│  │ Thank you for booking with Jolly Retreats!                    │ │
│  │                                                                │ │
│  │ 📋 Tour Details:                                               │ │
│  │ • Booking ID: BK-1234567890                                   │ │
│  │ • Tour Name: Paradise Island Adventure                        │ │
│  │ • Travel Dates: May 20, 2026 to May 25, 2026                 │ │
│  │ • Number of Travelers: 2                                      │ │
│  │ • Price Per Person: $1,500                                    │ │
│  │ • Total Amount: $3,300                                        │ │
│  │                                                                │ │
│  │ 👥 Primary Contact: John Doe                                  │ │
│  │ 📞 +1234567890                                                │ │
│  │                                                                │ │
│  │ 🧑‍🤝‍🧑 Traveler Details:                                         │ │
│  │ 1. John Doe (Age: 30, Male)                                   │ │
│  │ 2. Jane Doe (Age: 28, Female)                                 │ │
│  │                                                                │ │
│  │ 📎 Attachments: invoice-BK-1234567890.pdf                     │ │
│  │                                                                │ │
│  │ Best regards,                                                  │ │
│  │ Jolly Retreats Team                                            │ │
│  │                                                                │ │
│  │ ⚠️ Important: The invoice PDF is attached. Please keep it.    │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ✅ Confirmation received by user!                                   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ STEP 9: FRONTEND SHOWS SUCCESS MESSAGE                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Confirmation Page Displays:                                         │
│                                                                       │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                                                               ║  │
│  ║            ✅ Confirm Reservation                            ║  │
│  ║                                                               ║  │
│  ║        Your booking is confirmed instantly after             ║  │
│  ║        submission.                                           ║  │
│  ║                                                               ║  │
│  ║        📊 Booking Summary:                                   ║  │
│  ║        • Booking ID: BK-1234567890                           ║  │
│  ║        • Status: ✅ Confirmed                                ║  │
│  ║        • Check-in: May 20, 2026                              ║  │
│  ║        • Check-out: May 25, 2026                             ║  │
│  ║        • Total: $3,300                                       ║  │
│  ║                                                               ║  │
│  ║        📧 Confirmation email sent to: john@email.com         ║  │
│  ║                                                               ║  │
│  ║        📥 Download Invoice as PDF                            ║  │
│  ║                                                               ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

```

## Email Content Breakdown

### Email Template Structure:

```
┌─────────────────────────────────────────────────────────┐
│                   HEADER SECTION                         │
│  Background: Linear gradient (Green)                    │
│  ┌───────────────────────────────────────────────────┐ │
│  │  🎉 Booking Confirmation                          │ │
│  │  Your tour booking has been confirmed!            │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              MAIN CONTENT SECTION                        │
│                                                          │
│  Dear [Guest Name],                                     │
│  Thank you for booking with Jolly Retreats!            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📋 TOUR/PROPERTY DETAILS                         │  │
│  │  ├─ Booking ID: [ID]                             │  │
│  │  ├─ Service Name: [Name]                         │  │
│  │  ├─ Dates: [Start] to [End]                      │  │
│  │  ├─ Guests/Travelers: [Count]                    │  │
│  │  ├─ Price/Person: $[Amount]                      │  │
│  │  ├─ Tax: $[Amount]                               │  │
│  │  └─ Total: $[Amount]                             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📍 LOCATION                                      │  │
│  │  [Service Location]                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  👥 PRIMARY CONTACT                              │  │
│  │  Name: [Contact Name]                            │  │
│  │  Phone: [Phone Number]                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🧑‍🤝‍🧑 GUEST/TRAVELER DETAILS                    │  │
│  │  1. [Name] - Age: [Age], Gender: [Gender]        │  │
│  │  2. [Name] - Age: [Age], Gender: [Gender]        │  │
│  │  ...                                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📎 IMPORTANT: Invoice PDF Attached              │  │
│  │  Please keep for your records                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ✅ NEXT STEPS                                    │  │
│  │  1. Review your booking details                  │  │
│  │  2. Download and save the invoice PDF            │  │
│  │  3. Check email for updates                      │  │
│  │  4. Contact us if you have questions             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Best regards,                                          │
│  **Jolly Retreats Team**                               │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              FOOTER SECTION                              │
│  © 2026 Jolly Retreats. All rights reserved.            │
│  This is an automated email.                            │
│  For support, contact us through our website.           │
└─────────────────────────────────────────────────────────┘
```

## Key Features ✅

| Feature | Details |
|---------|---------|
| **Auto-sending** | Emails sent automatically on confirmation |
| **Recipients** | Primary guest/traveler email address |
| **Content** | Professional HTML template with all booking details |
| **Attachments** | Invoice PDF generated and included |
| **Error Handling** | Non-blocking - doesn't fail booking if email fails |
| **Logging** | All email activity logged in backend console |
| **Support** | Works for all service types: tours, properties, services |

## Implementation Status ✅ COMPLETE

- ✅ Email sending integrated into reservation confirmation
- ✅ Works for all booking types (tours, properties, restaurants, etc.)
- ✅ Invoice PDF automatically generated and attached
- ✅ Professional HTML email template
- ✅ Gmail SMTP configured and working
- ✅ Backend logging for debugging
- ✅ Non-blocking implementation (doesn't interrupt booking flow)
