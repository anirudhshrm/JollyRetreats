/**
 * Jest Test Setup File for Backend
 * Common utilities and helpers for testing
 */

// Setup global timeouts
jest.setTimeout(10000);

// Mock console methods if needed (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

/**
 * Helper function to create mock database records
 */
global.mockUser = () => ({
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  password_hash: 'hashed_password',
  created_at: new Date(),
  updated_at: new Date()
});

global.mockTour = () => ({
  id: 1,
  name: 'Test Tour',
  location: 'Test Location',
  price: 5000,
  capacity: 20,
  available_slots: 20,
  description: 'Test Description',
  created_at: new Date()
});

global.mockBooking = () => ({
  id: 1,
  user_id: 1,
  tour_id: 1,
  booking_date: new Date(),
  number_of_guests: 2,
  total_price: 10000,
  status: 'confirmed',
  created_at: new Date()
});

module.exports = {};
