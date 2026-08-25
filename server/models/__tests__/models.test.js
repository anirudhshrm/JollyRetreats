/**
 * Database Models Tests
 * Example test file for database model functions
 */

describe('Database Models', () => {
  describe('User Model', () => {
    it('should create user object with required fields', () => {
      const user = {
        id: 1,
        email: 'user@example.com',
        username: 'testuser',
        created_at: new Date()
      };

      expect(user.id).toBeDefined();
      expect(user.email).toBe('user@example.com');
      expect(user.username).toBe('testuser');
    });

    it('should validate user email field', () => {
      const user = { email: 'valid@example.com' };
      expect(user.email).toMatch(/@/);
    });
  });

  describe('Tour Model', () => {
    it('should create tour object with required fields', () => {
      const tour = {
        id: 1,
        name: 'Beach Tour',
        location: 'Maldives',
        price: 5000,
        capacity: 20,
        available_slots: 20
      };

      expect(tour.name).toBe('Beach Tour');
      expect(tour.capacity).toBeGreaterThan(0);
      expect(tour.available_slots).toBeLessThanOrEqual(tour.capacity);
    });

    it('should track available slots', () => {
      const tour = { capacity: 20, available_slots: 15 };
      expect(tour.available_slots).toBeLessThan(tour.capacity);
    });
  });

  describe('Booking Model', () => {
    it('should create booking object with required fields', () => {
      const booking = {
        id: 1,
        user_id: 1,
        tour_id: 1,
        booking_date: new Date(),
        number_of_guests: 4,
        total_price: 20000,
        status: 'confirmed'
      };

      expect(booking.user_id).toBeDefined();
      expect(booking.status).toBe('confirmed');
      expect(booking.number_of_guests).toBeGreaterThan(0);
    });

    it('should validate booking status', () => {
      const validStatuses = ['pending', 'confirmed', 'cancelled'];
      const booking = { status: 'confirmed' };
      
      expect(validStatuses).toContain(booking.status);
    });
  });
});
