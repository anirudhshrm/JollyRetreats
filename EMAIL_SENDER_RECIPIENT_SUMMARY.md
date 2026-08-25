# 📧 Email Sender & Recipient Overview

## Quick Answer

**SENDER:** All emails come FROM `anirudhshrm009@gmail.com`

**RECIPIENTS:** Depend on the email type (see below)

---

## Email Type 1: Admin Sending Custom Email

**When:** Admin clicks 📧 "Send Email" button in Tour Bookings

**FROM:** `anirudhshrm009@gmail.com`

**TO:** The specific traveler you selected and clicked the button for

**Example:**
- Booking has 3 travelers
- Admin clicks 📧 button next to "Sarah" 
- Email goes TO: sarah@email.com
- Admin clicks 📧 button next to "Mike"
- Email goes TO: mike@email.com

**Code Reference:** [server/config/mailer.js](server/config/mailer.js) - `sendCustomEmailToTraveler()`

---

## Email Type 2: Automatic Booking Confirmation

**When:** A new tour booking is created

**FROM:** `anirudhshrm009@gmail.com`

**TO:** The FIRST traveler's email in the booking list

**Example:**
```
Booking created with travelers:
1. Sarah Chen      → sarah@email.com  ← GETS EMAIL
2. Michael Brown   → michael@email.com
3. Lisa Wong       → lisa@email.com
```

**Code Reference:** [server/config/mailer.js](server/config/mailer.js) - `sendBookingConfirmationEmail()`

---

## How to Find Email Addresses

### In Admin Dashboard:
1. Go to **Admin Dashboard**
2. Navigate to **Tour Bookings**
3. Click on a booking to expand details
4. Look for **"Traveler Details"** section
5. See **"EMAIL"** column
6. Those are all the recipient addresses

### In Database:
```sql
SELECT email FROM travelers WHERE booking_id = ?;
```

---

## Configuration Details

| Setting | Value |
|---------|-------|
| **Sender Email** | `anirudhshrm009@gmail.com` |
| **Configuration File** | `server/.env` (EMAIL_USER) |
| **SMTP Provider** | Gmail |
| **Port** | 587 (TLS) |
| **Auth Method** | OAuth2 App Password |
| **Module** | Nodemailer v8.0.7 |

---

## Email Flow Diagram

```
Admin Dashboard
      ↓
   [Tour Booking Page]
      ↓
   [Traveler Table with 📧 buttons]
      ↓
   [Click 📧 next to traveler]
      ↓
   [Email Dialog Opens]
      ↓
   [Enter Subject & Message]
      ↓
   [Click "Send"]
      ↓
   API POST: /tour-bookings/:bookingId/send-email
      ↓
   Backend Validation (Admin Auth Check)
      ↓
   Nodemailer Transporter
      ↓
   Gmail SMTP (anirudhshrm009@gmail.com)
      ↓
   [Email sent TO selected traveler's address]
```

---

## Summary Table

| Scenario | From | To | When |
|----------|------|-----|------|
| Admin custom email | `anirudhshrm009@gmail.com` | Selected traveler | When admin clicks 📧 |
| Booking confirmation | `anirudhshrm009@gmail.com` | First traveler | When booking created |

---

## Testing Recipients

To test the email system:

1. **Create a test booking** with multiple travelers
2. Use **real email addresses** for travelers (or test emails)
3. **Click 📧 button** next to a traveler
4. **Send a test message**
5. **Check the recipient's inbox**

### Test Recipients You Could Use:
- `anirudhshrm009@gmail.com` (your main email)
- Other personal email addresses
- Test email services (temp-mail, mailinator, etc.)

---

## Important Notes

✅ **Sender is always:** `anirudhshrm009@gmail.com`

⚠️ **Recipients are dynamic:** Pulled from traveler data in database

✅ **Admin control:** Admins choose which traveler gets which email

✅ **Email addresses visible:** In Admin Dashboard's "Traveler Details" table

🔐 **Security:** Only authenticated admins can send emails

---

## Need to Change Sender Email?

To send emails from a different address:

1. Edit `server/.env`
2. Change `EMAIL_USER` to your desired email
3. Update `EMAIL_PASSWORD` to the app password for that email
4. Restart the server

Current setting uses `anirudhshrm009@gmail.com` because that's the configured sender in Gmail.

