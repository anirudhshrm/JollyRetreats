# Jest Testing Setup Guide - Backend

## ✅ Complete Setup

### Installed Packages
- `jest` - Testing framework
- `supertest` - HTTP assertion library for testing Express apps

### Files Created

1. **jest.config.js** - Jest configuration file
2. **jest.setup.js** - Test setup file with mock helpers
3. **routes/__tests__/health.test.js** - API endpoint testing example
4. **middleware/__tests__/middleware.test.js** - Middleware testing example
5. **utils/__tests__/validators.test.js** - Utility function testing example
6. **models/__tests__/models.test.js** - Database model testing example

### Updated Files

- **server/package.json** - Added test scripts

## 📋 Available Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- routes/__tests__/health.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="Auth"

# Update snapshots
npm test -- -u
```

## 📝 Test Structure

Tests are organized by module:

```
server/
├── routes/__tests__/
│   └── health.test.js           # API route testing
├── middleware/__tests__/
│   └── middleware.test.js        # Middleware testing
├── utils/__tests__/
│   └── validators.test.js        # Utility function testing
├── models/__tests__/
│   └── models.test.js            # Database model testing
├── jest.config.js                # Jest configuration
├── jest.setup.js                 # Test setup & mocks
└── package.json                  # Test scripts
```

## 🧪 Writing Tests

### Basic Test Structure

```javascript
describe('Feature Name', () => {
  it('should do something', () => {
    expect(value).toBe(expected);
  });

  it('should handle edge case', () => {
    expect(function).toThrow();
  });
});
```

### Testing Express Routes

```javascript
const request = require('supertest');
const express = require('express');

const app = express();
app.get('/api/path', (req, res) => res.json({ data: 'test' }));

describe('API Routes', () => {
  it('should return data', async () => {
    const res = await request(app).get('/api/path');
    expect(res.status).toBe(200);
    expect(res.body.data).toBe('test');
  });
});
```

### Using Mock Helpers

```javascript
describe('User Service', () => {
  it('should create user', () => {
    const user = global.mockUser();
    expect(user.email).toBe('test@example.com');
  });

  it('should book tour', () => {
    const booking = global.mockBooking();
    expect(booking.status).toBe('confirmed');
  });
});
```

## 🔍 Common Assertions

```javascript
// Equality
expect(value).toBe(5);
expect(object).toEqual({ name: 'John' });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(3.14, 1);

// Strings
expect(text).toMatch(/pattern/);
expect(text).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Functions
expect(fn).toThrow();
expect(fn).toThrow(Error);

// Promises
expect(promise).resolves.toBe(value);
expect(promise).rejects.toThrow();
```

## 📊 Coverage Report

Run coverage analysis:

```bash
npm run test:coverage
```

View detailed coverage report in `coverage/` directory.

## 🚀 Best Practices

1. **Descriptive Test Names** - Use clear, specific test names
   ```javascript
   // ❌ Bad
   it('works', () => {});
   
   // ✅ Good
   it('should validate email format correctly', () => {});
   ```

2. **Test One Thing** - Each test should verify one behavior
   ```javascript
   // ✅ Good - Testing one thing
   it('should accept valid emails', () => {
     expect(validateEmail('test@example.com')).toBe(true);
   });
   ```

3. **Use Setup & Teardown** - Clean up after tests
   ```javascript
   beforeEach(() => {
     // Setup before each test
   });

   afterEach(() => {
     // Cleanup after each test
   });
   ```

4. **Mock External Dependencies** - Don't rely on real databases
   ```javascript
   jest.mock('../db', () => ({
     query: jest.fn()
   }));
   ```

5. **Keep Tests Fast** - Avoid timeouts and slow operations

## 🐛 Debugging Tests

Run a specific test:
```bash
npm test -- routes/__tests__/health.test.js
```

Run with verbose output:
```bash
npm test -- --verbose
```

Run only failing tests:
```bash
npm test -- --onlyChanged
```

## ✨ Next Steps

1. Write tests for existing routes in `routes/__tests__/`
2. Create tests for middleware functions
3. Test database models and queries
4. Set up CI/CD to run tests automatically
5. Aim for >80% code coverage

---

For more information, visit [Jest Documentation](https://jestjs.io/)
