# Guest Details Implementation for Property Reservations

## Overview
Added comprehensive guest details collection during property reservation checkout. When users select multiple guests, they must now provide detailed information for each person.

## Features Implemented

### 1. **Guest Detail Fields**
Each guest requires the following information:
- **Full Name**: Guest's complete name
- **Age**: Guest's age (1-120)
- **Contact Number**: Guest's phone number or contact information

### 2. **Dynamic Form Generation**
- Guest detail form fields are dynamically generated based on the number of guests selected
- Each guest has their own labeled section (Guest 1, Guest 2, etc.)
- The form appears only when guests > 0

### 3. **Validation**
- All guest details are **required** before booking confirmation
- Form validates:
  - All fields (name, age, contact) are filled for each guest
  - Proper data types (age is numeric)
  - Age is between 1-120

### 4. **User Experience**
- Clear, organized layout with responsive grid (3 columns on larger screens)
- Inline error messages for validation failures
- Visual feedback when number of guests is changed (form resets)
- Guest count changes automatically regenerate the guest details fields

### 5. **Data Persistence**
Guest details are now included in:
- **Booking API Request**: Sent as `guestDetails` array with booking confirmation
- **Invoice/Receipt**: Guest information is displayed in the generated PDF invoice
- **Email Notifications**: Can be used for booking confirmation emails

## Technical Changes

### Modified Files
- `src/pages/main/checkout.tsx`

### New Interfaces
```typescript
interface GuestDetail {
  name: string
  age: string
  contact: string
}
```

### State Management
- Added `guestDetails` state to store guest information
- Added `handleGuestCountChange()` function to initialize guest details array
- Validation logic in `handleConfirm()` to ensure all guest details are complete

### API Integration
Updated booking request payload to include:
```json
{
  "serviceType": "property",
  "serviceId": 123,
  "bookingCount": 2,
  "bookingDate": "2026-05-25 00:00:00",
  "dropoffDate": "2026-05-28 00:00:00",
  "status": "confirmed",
  "guestDetails": [
    {
      "name": "John Doe",
      "age": "35",
      "contact": "+1-234-567-8900"
    },
    {
      "name": "Jane Smith",
      "age": "32",
      "contact": "+1-234-567-8901"
    }
  ]
}
```

## UI Components

### Guest Details Section
Located below the guest count input in the checkout form:
- Displays for each selected guest
- Organized with clear labels
- Visual separation between guest entries
- Responsive grid layout (3 columns on desktop, stacked on mobile)

### Invoice/Receipt
Guest information is now included in both:
- **PDF Invoice**: Shows all guest details in structured format
- **Email Confirmation**: Guest details are embedded in confirmation emails

## Validation Flow

1. User selects number of guests
2. Guest detail form appears for each guest
3. User fills in name, age, and contact for each guest
4. On "Confirm Booking" click:
   - Check-in/out dates validated
   - Guest count verified
   - Each guest's fields validated (no empty fields)
   - If all valid → booking confirmation
   - If invalid → display error message

## User Journey

```
1. Select Property → Browse Properties
2. Click "Book Stay" → Property Detail Page
3. Pre-filled dates and default guest count (2)
4. Checkout Page appears
5. User can modify:
   - Check-in date
   - Check-out date
   - Guest count (1-max capacity)
6. Guest details section appears
7. User fills in guest information:
   - Guest 1: Name, Age, Contact
   - Guest 2: Name, Age, Contact
   - ... (for each guest)
8. Click "Confirm Booking"
9. Validation runs
10. If valid: Booking confirmed → Invoice generated
11. If invalid: Error shown → User corrects and retries
```

## Testing

✅ Build: Successful (no TypeScript errors)
✅ Tests: All passing
✅ Type Safety: Fully typed with TypeScript

## Database

The `dropoff_date` column was added to the bookings table to support date range tracking for rentals:
- Column: `dropoff_date` (DATETIME NULL)
- Indexes: Created for performance optimization

## Notes

- Guest details are validated client-side before sending to server
- The server receives all guest information in a single booking request
- Guest details can be stored and used for:
  - Email notifications
  - Invoice generation
  - Booking confirmations
  - Guest communication
  - Capacity tracking

## Future Enhancements

- Add guest detail templates (save frequently used guests)
- Automatic phone number formatting
- International phone number validation
- Guest preference collection (room preferences, dietary restrictions, etc.)
- Export guest list feature
