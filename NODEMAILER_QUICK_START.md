# 📧 Email Configuration Quick Start

## What Was Added?

Automatic confirmation emails are now sent when travelers complete their tour bookings.

## Quick Setup (2 steps)

### Step 1️⃣: Get Gmail App Password
- Go to: https://myaccount.google.com/apppasswords
- Select "Mail" and "Windows Computer"
- Copy the 16-character password (remove spaces)

### Step 2️⃣: Update .env
Edit `/server/.env`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

That's it! Restart your server.

## Testing

1. Start backend: `npm --prefix server run dev`
2. Start frontend: `npm run dev:client`
3. Create a test booking
4. Check your email inbox for confirmation

## What's in the Email?

✅ Tour name and description
✅ Travel dates
✅ All traveler details
✅ Booking ID and amount
✅ Invoice PDF attached

## Files Changed

- ✅ `/server/config/mailer.js` (new)
- ✅ `/server/routes/tourBookings.js` (updated)
- ✅ `/server/.env` (updated)
- ✅ `/server/package.json` (nodemailer added)

## Troubleshooting

**Email not arriving?**
- Check spam/junk folder
- Verify app password format (no spaces)
- Check server logs for errors
- Make sure 2FA is enabled on Gmail

**Need help?**
- See full guide: `EMAIL_SETUP_GUIDE.md`
