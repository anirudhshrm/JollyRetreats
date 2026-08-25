# 📧 EMAIL ROUTING GUIDE - Which Mail is Sent to Which Address

## 1️⃣ CUSTOM EMAILS FROM ADMIN (New Feature)

**When:** Admin clicks 📧 button and sends email to a traveler

**Sender (FROM):** 
```
anirudhshrm009@gmail.com (configured in .env as EMAIL_USER)
```

**Recipient (TO):**
```
The specific traveler's email address
(entered by traveler during booking)
```

**Example:**
```
FROM: anirudhshrm009@gmail.com
TO:   john.doe@gmail.com  (traveler's email)
SUBJECT: "Travel Tips for Your Upcoming Tour"
MESSAGE: Custom message from admin
```

**How it works:**
1. Admin goes to Tour Bookings
2. Admin clicks 📧 button next to traveler "John Doe"
3. Dialog opens showing: john.doe@gmail.com
4. Admin enters subject and message
5. Email sends TO john.doe@gmail.com FROM anirudhshrm009@gmail.com

---

## 2️⃣ BOOKING CONFIRMATION EMAILS (Automatic)

**When:** User completes a tour booking

**Sender (FROM):**
```
anirudhshrm009@gmail.com (configured in .env as EMAIL_USER)
```

**Recipient (TO):**
```
Primary traveler's email (travelers[0].email)
OR customer email as fallback
```

**Logic:**
```javascript
// Priority order for recipient:
1. First traveler's email → booking.travelers[0].email
2. Fallback: Customer email → booking.customer_email
3. Default: 'Guest' if no name available
```

**Example:**
```
Booking has 2 travelers:
  - Sarah: sarah@gmail.com
  - Mike: mike@gmail.com

Email is sent TO: sarah@gmail.com (first traveler)
FROM: anirudhshrm009@gmail.com
SUBJECT: "Booking Confirmation - BK-12345 | Himalayan Adventure"
CONTENT: Tour details, pricing, invoice PDF
```

---

## 📊 EMAIL SUMMARY TABLE

| Email Type | FROM | TO | When | Status |
|-----------|------|-----|------|--------|
| **Custom Email** | anirudhshrm009@gmail.com | Traveler's email | Admin sends from admin panel | ✅ WORKING |
| **Booking Confirmation** | anirudhshrm009@gmail.com | Primary traveler's email | User completes booking | ✅ WORKING |

---

## 🔑 KEY POINTS

### Admin Custom Emails:
- **Sender:** Always `anirudhshrm009@gmail.com`
- **Recipient:** The specific traveler selected by admin
- **How to find recipient:**
  - Open Admin Dashboard
  - Go to Tour Bookings
  - Find the booking
  - Look at "Traveler Details" table
  - See "EMAIL" column
  - That's where the email will be sent

### Booking Confirmation Emails:
- **Sender:** Always `anirudhshrm009@gmail.com`
- **Recipient:** First traveler in the booking
- **Automatic:** Sent immediately when booking is created
- **Includes:** Tour details, pricing, PDF invoice

---

## 🔧 EMAIL SENDER CONFIGURATION

**Configured in:** `server/.env`

```env
EMAIL_USER=anirudhshrm009@gmail.com
EMAIL_PASSWORD=tqem syar mtro jdhm
```

**Email Service:** Gmail SMTP  
**Library:** Nodemailer v8.0.7  
**Status:** ✅ Configured

---

## 📋 RECIPIENTS BY SCENARIO

### Scenario 1: Single Traveler Booking
```
Booking Created:
  - Traveler: John Doe (john.doe@gmail.com)
  
Email Sent To:
  → john.doe@gmail.com ✓

Admin Sends Email:
  - Admin clicks 📧 on John Doe
  → john.doe@gmail.com ✓
```

### Scenario 2: Multiple Travelers Booking
```
Booking Created:
  - Traveler 1: Sarah (sarah@gmail.com)
  - Traveler 2: Mike (mike@gmail.com)
  - Traveler 3: Lisa (lisa@gmail.com)
  
Confirmation Email Sent To:
  → sarah@gmail.com (FIRST traveler only) ✓

Admin Can Send To:
  → sarah@gmail.com (click Sarah's 📧)
  → mike@gmail.com (click Mike's 📧)
  → lisa@gmail.com (click Lisa's 📧)
```

### Scenario 3: No Valid Email
```
If traveler has NO email:
  - Error: "Traveler does not have a valid email address"
  - Email NOT sent
  - Admin sees error message
```

---

## 💡 SUMMARY

**The short answer:**

✅ **Custom emails from admin** → Send to that specific traveler's email  
✅ **Booking confirmations** → Send to the first traveler's email  

All emails originate from: **anirudhshrm009@gmail.com**

---

## 🔍 FIND EMAIL ADDRESSES

**Where to see traveler emails:**
1. Admin Dashboard
2. Tour Bookings page
3. Look at each booking
4. See "Traveler Details" table
5. Look at "EMAIL" column
6. These are the addresses that will receive emails

**Example table:**
```
Name    | Age | Gender | Email              | Action
--------|-----|--------|--------------------|--------
Sarah   | 28  | Female | sarah@gmail.com    | 📧
Mike    | 32  | Male   | mike@gmail.com     | 📧
Lisa    | 26  | Female | lisa@gmail.com     | 📧
```

Clicking 📧 button sends email to that person's email address.

---

**Status: ✅ Clear email routing configured and working**
