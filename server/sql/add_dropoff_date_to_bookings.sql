-- Add dropoff_date column to bookings table for car rental and property bookings
-- This field tracks the end date for rentals (pickup to dropoff max 3 days for cars)

ALTER TABLE bookings ADD COLUMN dropoff_date DATETIME NULL AFTER booking_date;

-- Add index for dropoff_date for better query performance
CREATE INDEX idx_bookings_dropoff_date ON bookings(dropoff_date);
CREATE INDEX idx_bookings_date_range ON bookings(booking_date, dropoff_date);
