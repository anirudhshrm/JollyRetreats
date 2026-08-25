# Email Configuration Guide - Nodemailer Setup

## Overview
The booking confirmation emails are now configured to send automatically when a traveler completes a booking. The email includes:
- Tour name and description
- Travel dates
- Booking details (amount, taxes, etc.)
- Traveler personal information
- Invoice PDF attachment

## Configuration Steps

### Step 1: Gmail App Password Setup (Recommended)

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/
   - Sign in with your Gmail account

2. **Enable 2-Factor Authentication** (if not already enabled)
   - Click "Security" in the left sidebar
   - Enable "2-Step Verification"

3. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password

4. **Update .env file**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```
   Replace with your actual Gmail and the 16-character app password (remove spaces)

### Step 2: Environment Variables

Update `/server/.env`:
```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-without-spaces
```

### Step 3: Verify Installation

```bash
cd server
npm list nodemailer
```

You should see: `nodemailer@^6.9.x` (or similar version)

## Testing the Email

### Option 1: Using Mailtrap (Test Email Service)

1. Go to https://mailtrap.io/
2. Sign up for a free account
3. Get your SMTP credentials
4. Update `.env`:
   ```env
   EMAIL_USER=your_mailtrap_username
   EMAIL_PASSWORD=your_mailtrap_password
   ```

### Option 2: Test with Your Booking

1. Start the server: `npm run dev`
2. Start the frontend: `npm run dev:client`
3. Create a test booking
4. Check your email inbox (and spam folder) for the confirmation email

## Email Features

✅ Beautiful HTML formatted email
✅ Tour details and description
✅ Traveler information
✅ Booking summary with costs
✅ Invoice PDF attachment
✅ Professional branding

## Troubleshooting

### Email Not Sending?

1. **Check Console Logs**
   - Look for error messages in the server terminal

2. **Verify Gmail App Password**
   - Make sure you removed spaces from the password
   - Confirm 2FA is enabled on your Google account

3. **Check Spam Folder**
   - Email might be marked as spam
   - Add sender to contacts to whitelist

4. **Email Credentials Missing**
   - Ensure `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
   - Restart the server after updating `.env`

5. **Database/PDF Generation Issue**
   - The system gracefully handles PDF generation failures
   - Booking still completes, but email won't have attachment
   - Check server logs for specific errors

## Email Template Details

The email includes:

```
📧 Subject: Booking Confirmation - [BOOKING_ID] | [TOUR_NAME]

🎉 Header Section
- Welcome message
- Booking status

📋 Tour Details
- Booking ID
- Tour name
- Travel dates
- Number of travelers
- Price breakdown
- Total amount

📝 Tour Description
- Full tour description

👥 Primary Contact
- Lead traveler name and phone

👤 Traveler Details
- All travelers with age, gender, and contact info

📎 Attachments
- Invoice PDF file
```

## Using Alternative Email Services

### For SendGrid:
```javascript
// Update config/mailer.js
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
})
```

### For Mailgun:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_EMAIL,
    pass: process.env.MAILGUN_PASSWORD
  }
})
```

## File Changes Made

1. **Created**: `/server/config/mailer.js`
   - Nodemailer configuration
   - Email template HTML
   - Send email function

2. **Updated**: `/server/routes/tourBookings.js`
   - Added email import
   - Send email after booking creation
   - Error handling for email failures

3. **Updated**: `/server/.env`
   - Added EMAIL_USER and EMAIL_PASSWORD variables

4. **Updated**: `/server/.env.example`
   - Added email configuration template

5. **Updated**: `/server/package.json`
   - Added nodemailer dependency

## Important Notes

⚠️ **Email Sending is Non-Blocking**
- If email fails to send, the booking still completes successfully
- Users won't know if email delivery failed
- Check server logs for email errors

⚠️ **Production Considerations**
- Use a dedicated email service (SendGrid, Mailgun) in production
- Never commit `.env` with real credentials
- Set strong email account passwords
- Monitor email delivery rates
- Test spam filter settings

⚠️ **GDPR/Privacy**
- Ensure user consent for email communications
- Include unsubscribe option if needed
- Protect user email addresses

## Next Steps

1. ✅ Install nodemailer: `npm install nodemailer` (already done)
2. ✅ Update .env with email credentials
3. ✅ Test by creating a booking
4. ✅ Verify email arrives in inbox
5. ✅ Check invoice attachment is included

For questions or issues, check the server console logs for detailed error messages.
