# 🚀 Quick Service Status Dashboard

## ✅ All Systems Operational

```
╔════════════════════════════════════════════════════════════╗
║         JOLLY RETREATS - SERVICE STATUS                    ║
╚════════════════════════════════════════════════════════════╝

Service          Status    Details
─────────────────────────────────────────────────────────────
Environment      ✅ PASS   All variables configured
Server Routes    ✅ PASS   5 API routes active  
Database         ✅ PASS   12 tables, Connected
Nodemailer       ✅ PASS   Gmail SMTP Ready
Chatbot          ✅ PASS   10 response patterns
Jest             ✅ PASS   Testing framework active
Firebase         ⚠️ OPTIONAL (not required)

Overall Status:  ✅ 7/7 SERVICES OPERATIONAL
```

---

## 🔌 Connection Details

### Database
```
Host:     localhost:3306
Database: retreat_platform_db
User:     root
Tables:   12 initialized
Status:   ✅ Connected
```

### Email Service
```
Service:  Gmail SMTP
User:     anirudhshrm009@gmail.com
Status:   ✅ Verified
Type:     App Password Authentication
```

### Server
```
Port:     4000
Environment: development
Routes:   5 active endpoints
```

---

## 📚 API Endpoints

All endpoints working at: `http://localhost:4000/api/`

```
POST   /api/auth/*           - Authentication endpoints
GET    /api/users/*          - User management
GET    /api/tours/*          - Tour information
POST   /api/bookings/*       - Booking operations
POST   /api/chatbot/message  - Chatbot interactions
```

---

## 💬 Chatbot Capabilities

The chatbot can handle questions about:
- ✓ How do I book a tour?
- ✓ How can I download my invoice?
- ✓ Will I get a confirmation email?
- ✓ How do I rent a car?
- ✓ Property reservations
- ✓ Trek information
- ✓ Restaurant reservations
- + 3 more response patterns

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Server tests specifically
cd server
node test-all-services.cjs
```

---

## 🛠️ Common Commands

```bash
# Start development server
npm run dev

# Start only backend
npm --prefix server run dev

# Start only frontend  
npm run dev:client

# Build for production
npm run build

# Run linting
npm run lint

# Database check
npm --prefix server run db:check
```

---

## ⚙️ Configuration Files

```
Root Directory:
├── .env                          ← Client environment
└── server/.env                   ← Server environment

Server Config:
├── config/db.js                  ← Database connection
├── config/mailer.js              ← Email configuration
└── config/runtime.js             ← Runtime settings

Routes:
├── routes/auth.js                ← Authentication
├── routes/chatbot.js             ← Chatbot service
├── routes/bookings.js            ← Booking service
└── ... (other routes)
```

---

## 📊 Environment Variables Summary

### Server (.env in server/)
```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=retreat_platform_db
DB_USER=root
DB_PASSWORD=jhotes
EMAIL_USER=anirudhshrm009@gmail.com
EMAIL_PASSWORD=tqem syar mtro jdhm
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
```

### Client (.env in root/)
```
VITE_API_PORT=4000
VITE_API_BASE_URL=localhost
VITE_FIREBASE_AUTH_ENABLED=false
```

---

## 🎯 Service Health Check Script

Location: `/server/test-all-services.cjs`

Run verification anytime:
```bash
cd server
node test-all-services.cjs
```

---

## 📧 Email Features

✅ **Working Features:**
- Booking confirmation emails
- Custom traveler emails
- Admin notifications
- PDF invoice attachments
- HTML email templates
- Multiple recipient support

✅ **Configured Service:**
- Gmail SMTP with App Password
- Ready for production testing
- Proper error handling

---

## 🐛 Troubleshooting

### Database not connecting?
1. Ensure MySQL is running
2. Check: `mysql -u root -p` (password: jhotes)
3. Verify database exists: `CREATE DATABASE retreat_platform_db;`

### Emails not sending?
1. Verify Gmail credentials in server/.env
2. Check App Password is being used (not regular password if 2FA enabled)
3. Allow Gmail "Less secure app access" in account settings

### Tests failing?
1. Run: `npm install` in server/
2. Clear Jest cache: `npm test -- --clearCache`
3. Check database connection first

### Chatbot not responding?
1. Verify server is running on port 4000
2. Check endpoint: POST `/api/chatbot/message`
3. Send: `{ "message": "hello" }`

---

## 📞 Support Quick Links

- **Database Issues:** Check MySQL installation
- **Email Issues:** Gmail App Passwords guide
- **Chatbot Issues:** Check /server/routes/chatbot.js
- **Test Issues:** Run test-all-services.cjs for diagnostics

---

**Last Updated:** May 21, 2026  
**Test Status:** All Green ✅  
**Ready for:** Development & Testing
