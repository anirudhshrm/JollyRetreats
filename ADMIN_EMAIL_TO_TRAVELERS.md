# 📧 Admin Email to Travelers Feature

## Overview

Admins can now send custom emails directly to any traveler from the Tour Bookings admin panel. This feature allows you to communicate updates, special offers, travel tips, or any other important information to travelers.

---

## How to Use

### Step 1: Navigate to Tour Bookings
1. Go to **Admin Dashboard** → **Tour Bookings**
2. You'll see a list of all tour bookings with traveler information

### Step 2: Find the Traveler
In each booking, you'll see a **Traveler Details** table showing:
- **Name**: Traveler's full name
- **Age**: Traveler's age
- **Gender**: Traveler's gender
- **Email**: Traveler's email address ✉️
- **Action**: Email button (envelope icon 📧)

### Step 3: Send Email
1. Click the **📧 Email** button next to the traveler
2. A dialog will open with:
   - **Traveler Name**: Pre-filled with traveler's name
   - **Email Address**: Shows the recipient's email
   - **Subject**: Enter the email subject line
   - **Message**: Write your message (supports multiple lines)

### Step 4: Compose and Send
1. Enter the email **Subject** (e.g., "Travel Tips for Your Upcoming Tour")
2. Write your **Message** (e.g., "Dear traveler, here are some tips for your upcoming tour...")
3. Click **Send Email**
4. You'll see a confirmation: "Email sent to [email@address.com]"

---

## ✨ Features

### ✓ Direct Traveler Communication
- Send emails directly to any traveler in a booking
- Personalized with traveler's name

### ✓ Email Validation
- Only valid emails can receive messages
- Admin must fill in subject and message before sending
- Real-time validation feedback

### ✓ Professional Email Template
- Emails have a branded header with Jolly Retreats logo
- Clean, readable format with proper styling
- Company footer with contact information

### ✓ Easy Integration
- One-click access from traveler rows
- Responsive dialog interface
- Loading states and error handling

---

## Email Components

Each email sent includes:

```
┌─────────────────────────────────────────┐
│  📧 Message from Jolly Retreats         │
│                                          │
│  Dear [Traveler Name],                  │
│                                          │
│  [Your custom message here]             │
│                                          │
│  Best regards,                          │
│  Jolly Retreats Team                    │
│                                          │
│  © 2026 Jolly Retreats                  │
│  All rights reserved                    │
└─────────────────────────────────────────┘
```

---

## Use Cases

### 📝 Example 1: Travel Tips
```
Subject: Important Travel Tips for Your Upcoming Tour

Message:
Dear John,

Here are some important tips for your upcoming Himalayan Adventure tour:

1. Pack warm clothing - temperatures can drop to -5°C at night
2. Bring comfortable hiking shoes with good grip
3. Stay hydrated - drink at least 2-3 liters of water daily
4. Acclimatize properly to avoid altitude sickness
5. Bring a power bank for your phones

See you soon!
```

### 📝 Example 2: Booking Confirmation
```
Subject: Your Booking is Confirmed!

Message:
Dear Sarah,

Great news! Your booking for the "Beach Paradise Retreat" has been confirmed.

Tour Details:
- Start Date: June 15, 2026
- End Date: June 22, 2026
- Duration: 7 nights
- Location: Maldives

We'll send you more details via email shortly. If you have any questions, please contact us.

Best regards,
Jolly Retreats Team
```

### 📝 Example 3: Special Offer
```
Subject: Exclusive Offer - 20% Off Next Booking

Message:
Dear Traveler,

Thank you for choosing Jolly Retreats! As a valued customer, we'd like to offer you a special 20% discount on your next booking.

Use code: JR20NEXT

Valid until: June 30, 2026

Explore our new tour packages and claim your discount!
```

---

## Technical Implementation

### Backend Endpoint
```
POST /api/tour-bookings/:bookingId/send-email
```

### Request Body
```json
{
  "travelerId": 1,
  "subject": "Your Email Subject",
  "message": "Your email message here"
}
```

### Response
```json
{
  "success": true,
  "message": "Email sent successfully to john@gmail.com",
  "data": {
    "email": "john@gmail.com",
    "travelerName": "John Doe",
    "messageId": "message-id-from-gmail"
  }
}
```

### Email Service
- **Service**: Gmail SMTP
- **From**: anirudhshrm009@gmail.com
- **Configuration**: Stored in `.env` file
- **Library**: Nodemailer v8.0.7

---

## Files Modified

### Frontend
1. **src/pages/admin/orders.tsx**
   - Added email dialog state management
   - Added traveler email column in table
   - Added send email button for each traveler
   - Added email composition dialog

2. **src/services/adminApi.ts**
   - Added `email` field to traveler type
   - Added `sendEmail` method to tourBookings API
   - Updated type definitions

### Backend
1. **server/routes/tourBookings.js**
   - Added `POST /:bookingId/send-email` endpoint
   - Validates traveler and email
   - Calls mailer service

2. **server/config/mailer.js**
   - Added `sendCustomEmailToTraveler()` function
   - Creates professional HTML email template
   - Handles email sending via Nodemailer

---

## Validation & Error Handling

### Frontend Validation
✓ Subject must not be empty
✓ Message must not be empty
✓ Both fields required before sending

### Backend Validation
✓ Booking must exist
✓ Traveler must exist in booking
✓ Traveler must have valid email
✓ Subject must be non-empty
✓ Message must be non-empty
✓ Admin authorization required

### Error Messages
- "Please fill in subject and message fields"
- "Traveler not found in this booking"
- "Traveler does not have a valid email address"
- "Failed to send email: [specific error]"

---

## Best Practices

### ✓ Do's
- Use clear, professional subject lines
- Keep messages concise and organized
- Use traveler's name for personalization
- Double-check email content before sending
- Send time-sensitive information promptly

### ✗ Don'ts
- Don't send spam or unwanted emails
- Don't include sensitive personal information
- Don't send emails at unusual hours
- Don't send duplicate emails unintentionally
- Don't include malicious links or attachments

---

## Troubleshooting

### Email Not Sending
1. Check traveler has a valid email address
2. Verify Gmail credentials in `.env` file
3. Check server logs for error messages
4. Ensure Nodemailer is properly configured

### Email Goes to Spam
1. This is normal for Gmail sending to Gmail
2. Gmail may flag bulk or unusual emails
3. Email is still delivered, just in Spam folder
4. Recipients can mark email as "Not Spam"

### Missing Email Column
1. Refresh the page
2. Clear browser cache
3. Check traveler data in database
4. Verify backend returned email field

---

## Summary

✅ **Feature is now live!**

Admins can:
- View traveler emails in the admin panel
- Send custom emails to any traveler
- Track email sending status
- Communicate important information directly

The feature integrates seamlessly with:
- Existing tour booking system
- Traveler email data stored during booking
- Gmail SMTP via Nodemailer
- Professional email templates

Ready to communicate with your travelers! 🎉
