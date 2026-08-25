# 📧 NodeMailer Email Service Setup Guide

## ✅ Current Status

The NodeMailer email service has been **FULLY INTEGRATED** into your tour booking system. Here's what's been done:

### ✓ Completed Setup
- ✅ NodeMailer package installed in server
- ✅ Email service utility created (`server/utils/emailService.js`)
- ✅ Mailer configuration file ready (`server/config/mailer.js`)
- ✅ Email sending integrated into booking routes
- ✅ PDF invoice included with confirmation email
- ✅ Beautiful HTML email template
- ✅ Traveler email data collected in booking form
- ✅ .env file configured for email credentials

---

## 🔧 Configuration Steps

### 1. **Add Email Credentials to .env**

Edit `server/.env` and update with your Gmail credentials:

```dotenv
# Email Configuration (Gmail)
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
```

### 2. **How to Generate Gmail App Password**

If you have **2-Factor Authentication enabled** on your Gmail account:

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Copy this password and paste it in your `.env` file as `EMAIL_PASSWORD`

**If you DON'T have 2FA enabled:**
1. Go to https://myaccount.google.com/lesssecureapps
2. Enable "Less secure app access"
3. Use your regular Gmail password in `.env` file

---

## 📬 Email Features

### What Gets Sent When a Booking is Confirmed:

The confirmation email includes:
- ✓ Tour Name
- ✓ Tour Description
- ✓ Travel Dates (Start & End)
- ✓ Total Number of Travelers
- ✓ Primary Contact Information
- ✓ All Traveler Details (Name, Age, Gender, Email, Contact)
- ✓ Pricing Breakdown (Per Person, Subtotal, Taxes, Total)
- ✓ **Invoice PDF attached** (automatically generated)
- ✓ Professional HTML formatting

### Email Sending Flow:

```
User clicks "Confirm Booking"
        ↓
Backend creates booking record
        ↓
Generates PDF invoice
        ↓
Sends HTML email with PDF attachment
        ↓
Email arrives in traveler's inbox
```

---

## 🧪 Testing the Email Service

### Test Email Configuration:

```bash
cd server
node -e "
import('./config/mailer.js').then(m => {
  m.testEmailConfiguration().then(result => {
    console.log(result.message);
    process.exit(0);
  });
});
"
```

### Manual Test - Send a Test Email:

Create a file `test-email.js` in the server folder:

```javascript
import { sendBookingConfirmationEmail } from './config/mailer.js'

const testBooking = {
  booking_id: 'TEST-001',
  customer_email: 'your-email@gmail.com',
  customer_name: 'Test User',
  primary_contact_person: 'Test User',
  primary_contact_phone: '+1234567890',
  tour_title: 'Test Tour',
  tour_description: 'This is a test tour',
  start_date: '2026-05-20',
  end_date: '2026-05-25',
  total_people: 1,
  price_per_person: 100,
  tax_amount: 12,
  total_amount: 112
}

sendBookingConfirmationEmail(testBooking, null).then(result => {
  console.log('Email test result:', result)
  process.exit(0)
})
```

Then run:
```bash
node test-email.js
```

---

## 🎨 Email Template Customization

The email template is in `server/config/mailer.js` (lines 30-100+).

To customize:
1. Edit the HTML in the `emailContent` variable
2. Change colors, add logo, adjust styling
3. Add/remove sections as needed

### Common Customizations:

**Change Email Header Color:**
```javascript
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
```

**Add Company Logo:**
```html
<img src="https://your-domain.com/logo.png" alt="Logo" style="height: 50px;">
```

**Change Email Footer:**
```html
<p>© 2026 Your Company Name. All rights reserved.</p>
```

---

## 🚨 Troubleshooting

### Email Not Sending?

1. **Check .env credentials:**
   ```bash
   # Make sure EMAIL_USER and EMAIL_PASSWORD are set correctly
   cat server/.env | grep EMAIL
   ```

2. **Check Gmail App Password:**
   - Verify you're using an App Password (not regular password) if 2FA is enabled
   - The password should be 16 characters without spaces

3. **Check Logs:**
   ```bash
   # Watch server logs
   npm run dev
   # Look for: "✓ Confirmation email sent" or "✗ Error sending"
   ```

4. **Test Connection:**
   ```bash
   node server/scripts/test-mailer.js
   ```

### Common Errors:

| Error | Solution |
|-------|----------|
| `Invalid login credentials` | Wrong EMAIL_USER or EMAIL_PASSWORD in .env |
| `Less secure app access disabled` | Enable it in Gmail settings or use App Password with 2FA |
| `Gmail blocked access` | Gmail thought the connection was suspicious. Allow it in your Gmail security settings |
| `timeout` | Check your internet connection or try a different email service |

---

## 📧 Using Different Email Services

By default, the system uses **Gmail**. To use a different service:

### For Outlook:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})
```

### For Custom SMTP:
```javascript
const transporter = nodemailer.createTransport({
  host: 'your-smtp-server.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})
```

---

## 📝 Email Data Structure

The email sending receives the following booking data:

```typescript
{
  booking_id: string              // e.g., "booking-123456"
  customer_email: string          // Traveler's email
  customer_name: string           // Traveler's full name
  primary_contact_person: string  // Primary contact name
  primary_contact_phone: string   // Primary contact phone
  tour_title: string              // Tour name
  tour_description: string        // Tour description
  start_date: string              // YYYY-MM-DD format
  end_date: string                // YYYY-MM-DD format
  total_people: number            // Number of travelers
  price_per_person: number        // Price per traveler
  tax_amount: number              // Tax calculated
  total_amount: number            // Total with tax
  travelers: Array<{
    name: string
    age: number
    gender: string
    contact_number: string
    email: string
  }>
}
```

---

## 🔐 Security Notes

1. **Never commit .env file** - It contains sensitive credentials
2. **Use App Passwords** - Don't use your main Gmail password
3. **Enable 2FA** - Always enable 2-factor authentication on your email
4. **Rotate credentials** - Change passwords regularly
5. **Monitor email logs** - Check server logs for failed sends

---

## 📞 Support

If you encounter issues:

1. Check the server console logs for error messages
2. Verify email credentials in `.env` file
3. Test Gmail App Password generation
4. Ensure nodemailer is installed: `npm list nodemailer`
5. Check firewall/network settings

---

## 🎯 Next Steps

1. ✅ Add your Gmail credentials to `.env`
2. ✅ Test the email service with the test script
3. ✅ Make a test booking to verify emails are sent
4. ✅ Customize the email template if needed
5. ✅ Monitor email delivery in your Gmail "Sent" folder

---

**Setup Status: ✅ READY TO USE**

Your NodeMailer email service is fully integrated and ready to send booking confirmation emails!
