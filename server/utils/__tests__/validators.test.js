/**
 * Utility Functions Tests
 * Example test file for utility functions like validators and JWT
 */

describe('Utility Functions', () => {
  describe('Email Validation', () => {
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    const validatePassword = (password) => {
      return password.length >= 8;
    };

    it('should accept passwords with 8+ characters', () => {
      expect(validatePassword('securePassword123')).toBe(true);
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(validatePassword('short')).toBe(false);
    });
  });

  describe('String Utilities', () => {
    it('should convert string to lowercase', () => {
      const input = 'HELLO WORLD';
      expect(input.toLowerCase()).toBe('hello world');
    });

    it('should trim whitespace', () => {
      const input = '  hello  ';
      expect(input.trim()).toBe('hello');
    });
  });
});
