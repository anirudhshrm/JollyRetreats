# Stripe Payment Integration Setup

## Overview
This guide explains how to set up Stripe payment processing for advance booking deposits (25% of total).

## Flow
1. User completes booking and clicks "Pay 25% Advance"
2. Redirects to `/payment` page with booking ID and amount
3. Stripe Elements form appears for card entry
4. Payment intent is created on backend
5. Card is processed via Stripe
6. On success, payment is confirmed and user is redirected back to checkout
7. UI shows "Advance paid $XXX"

## Setup Steps

### 1. Get Stripe API Keys
- Visit [stripe.com](https://stripe.com)
- Create an account or sign in
- Go to Dashboard → Developers → API Keys
- Copy **Publishable Key** and **Secret Key**

### 2. Frontend Configuration
Create or update `.env` file in root:
```
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

### 3. Backend Configuration
Create or update `server/.env` file:
```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET (optional for production)
```

### 4. Install Dependencies (Already Done)
```bash
# Frontend
npm install @stripe/react-stripe-js @stripe/stripe-js

# Backend
cd server && npm install stripe
```

### 5. API Endpoints Created
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment after Stripe processing
- `POST /api/payments/webhook` - Handle Stripe webhooks (optional)

### 6. Database (Optional)
If you want to track payments, create a `payments` table:
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  user_id INT NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Testing

### Test Cards (Stripe Provided)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

### Test Flow
1. Go to checkout page
2. Complete booking (click "Confirm Reservation")
3. Click "Pay 25% Advance"
4. Redirected to payment page
5. Enter test card `4242 4242 4242 4242`
6. Click "Pay $XX.XX"
7. Should see success and redirect back

## Frontend Components
- `src/pages/main/payment.tsx` - Payment page with Stripe Elements form
- `src/services/paymentService.ts` - API calls for payment intents and confirmation
- Modified `src/pages/main/checkout.tsx` - Updated to redirect on "Pay Advance" click

## Backend Components
- `server/routes/payments.js` - Payment endpoints

## Customization

### Change Advance Percentage
In `src/pages/main/checkout.tsx`:
```tsx
const amount = Math.round((total * 0.25) * 100) / 100  // Change 0.25 to desired percentage
```

### Add More Payment Methods
Update `PaymentForm` in `src/pages/main/payment.tsx` to use:
- `CardElement` (current)
- `ApplePayButton`
- `GooglePayButton`
- `PaymentRequestButton`

### Production Considerations
1. Update env keys to live keys (`pk_live_*` and `sk_live_*`)
2. Enable webhook signing for payment verification
3. Add proper error handling and logging
4. Implement 3D Secure authentication for higher security
5. Add PCI compliance measures

## Troubleshooting

### "Failed to create payment intent"
- Check `STRIPE_SECRET_KEY` is set correctly
- Verify booking exists and user is authenticated
- Check server logs for details

### Card declined
- Using test card? Use `4242 4242 4242 4242`
- Check card details format
- Verify payment intent was created successfully

### Payment succeeded but not recorded
- Check `payments` table if created
- Verify `/api/payments/confirm` endpoint is called
- Check server logs for database errors
