# Jest Quick Reference Guide

## 🚀 Running Tests

### Frontend (Root Directory)
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm test -- ComponentName   # Run specific test
npm test -- --testNamePattern="should render" # Pattern matching
```

### Backend (server/ Directory)
```bash
cd server
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm test -- routes          # Run tests in folder
npm test -- --listTests    # List all test files
```

---

## 📝 Writing Tests

### Test Template
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = processInput(input);
    
    // Assert
    expect(result).toBe('processed');
  });

  it('should handle edge cases', () => {
    expect(processInput(null)).toThrow();
  });
});
```

### React Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders and responds to events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Express Route Test
```javascript
const request = require('supertest');
const app = require('../app');

describe('GET /api/users', () => {
  it('returns users list', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

---

## 🔍 Common Assertions

### Equality & Truthiness
```javascript
expect(value).toBe(5)                    // Exact equality
expect(object).toEqual({ name: 'John' }) // Deep equality
expect(value).toBeTruthy()               // truthy value
expect(value).toBeFalsy()                // falsy value
expect(value).toBeNull()                 // null
expect(value).toBeUndefined()            // undefined
expect(value).toBeDefined()              // not undefined
```

### Numbers
```javascript
expect(value).toBeGreaterThan(3)
expect(value).toBeGreaterThanOrEqual(4)
expect(value).toBeLessThan(5)
expect(value).toBeLessThanOrEqual(4)
expect(0.1 + 0.2).toBeCloseTo(0.3)      // Floating point
```

### Strings & Patterns
```javascript
expect(text).toMatch(/regex/)
expect(text).toMatch('substring')
expect(text).toContain('substring')
expect(text).toHaveLength(5)
```

### Arrays & Objects
```javascript
expect(array).toContain(item)
expect(array).toHaveLength(3)
expect(object).toHaveProperty('name')
expect(object).toHaveProperty('name', 'John')
```

### Functions & Errors
```javascript
expect(func).toThrow()
expect(func).toThrow(Error)
expect(func).toThrow('specific message')
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith(arg1, arg2)
expect(mockFn).toHaveBeenCalledTimes(3)
```

### DOM Elements (React Testing Library)
```javascript
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveClass('active')
expect(element).toHaveAttribute('href', '/path')
expect(element).toHaveValue('text')
expect(element).toHaveStyle('color: red')
expect(element).toHaveTextContent('hello')
```

### Async
```javascript
expect(promise).resolves.toBe(value)
expect(promise).rejects.toThrow()
await expect(promise).resolves.toBe(value)
```

---

## 🎯 React Testing Library Queries

### By Role (Best)
```javascript
screen.getByRole('button')
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox')
screen.getByRole('checkbox')
screen.getByRole('heading', { level: 1 })
```

### By Label
```javascript
screen.getByLabelText(/email/i)
screen.getByLabelText('Email Address')
```

### By Placeholder
```javascript
screen.getByPlaceholderText(/search/i)
screen.getByPlaceholderText('Enter name')
```

### By Text
```javascript
screen.getByText(/welcome/i)
screen.getByText('Welcome')
```

### By Test ID
```javascript
screen.getByTestId('custom-id')
```

### Query Variants
```javascript
getByXxx()     // Throws if not found
queryByXxx()   // Returns null if not found
findByXxx()    // Async, waits for element
getAllByXxx()  // Returns array of elements
queryAllByXxx() // Returns array or empty
findAllByXxx() // Async array query
```

---

## 🖱️ User Events

```javascript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

await user.click(button)
await user.type(input, 'text')
await user.clear(input)
await user.selectOptions(select, 'option')
await user.hover(element)
await user.keyboard('{Enter}')
await user.tab()
await user.keyboard('{Shift>}A{/Shift}')  // Shift+A
```

---

## ⏱️ Async Handling

```javascript
// Wait for element to appear
await screen.findByRole('button')

// Wait for condition
await waitFor(() => {
  expect(element).toHaveValue('new')
})

// Wait with timeout
await waitFor(() => {
  expect(element).toBeVisible()
}, { timeout: 3000 })

// Wait for element to be removed
await waitFor(() => {
  expect(element).not.toBeInTheDocument()
})
```

---

## 🔧 Mocking

### Mock Functions
```javascript
const mockFn = jest.fn()
mockFn.mockReturnValue('value')
mockFn.mockReturnValueOnce('first')
mockFn.mockResolvedValue('async value')
mockFn.mockRejectedValue(new Error('fail'))
mockFn.mockImplementation((x) => x * 2)

expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledTimes(2)
```

### Mock Modules
```javascript
jest.mock('../api')
jest.mock('../api', () => ({
  fetchUsers: jest.fn().mockResolvedValue([])
}))
```

### Clear Mocks
```javascript
jest.clearAllMocks()      // Clear all mocks
jest.resetAllMocks()      // Reset all mocks
mockFn.mockClear()        // Clear specific mock
```

### Manual Mocks
```javascript
jest.spyOn(object, 'method')
jest.spyOn(object, 'method').mockReturnValue('mocked')
jest.spyOn(global, 'fetch').mockResolvedValue(...)
```

---

## 🏗️ Setup & Teardown

```javascript
beforeAll(() => {
  // Runs once before all tests
})

beforeEach(() => {
  // Runs before each test
})

afterEach(() => {
  // Runs after each test
})

afterAll(() => {
  // Runs once after all tests
})
```

---

## 📊 Test Coverage

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# Check specific file
npm test -- --coverage --collectCoverageFrom=src/App.tsx
```

---

## 🐛 Debugging

```bash
# Run specific test
npm test -- Button.test.tsx

# Verbose output
npm test -- --verbose

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Only changed files
npm test -- --onlyChanged

# Failed tests only
npm test -- --lastCommit

# Watch mode with pattern
npm test -- --watch Button
```

---

## 📋 Example Test Cases

### Component Visibility
```javascript
it('should show/hide element', () => {
  render(<Modal visible={true} />);
  expect(screen.getByRole('dialog')).toBeVisible();
});
```

### Form Submission
```javascript
it('should submit form', async () => {
  const user = userEvent.setup();
  const handleSubmit = jest.fn();
  
  render(<Form onSubmit={handleSubmit} />);
  
  await user.type(screen.getByLabelText(/email/i), 'test@test.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@test.com' });
});
```

### API Call
```javascript
it('should fetch data', async () => {
  jest.mock('../api', () => ({
    getUsers: jest.fn().mockResolvedValue([{ id: 1, name: 'John' }])
  }));
  
  render(<UserList />);
  
  expect(await screen.findByText('John')).toBeInTheDocument();
});
```

### Error Handling
```javascript
it('should display error message', async () => {
  const error = new Error('Network failed');
  jest.mock('../api', () => ({
    getUsers: jest.fn().mockRejectedValue(error)
  }));
  
  render(<UserList />);
  
  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

---

## 📚 File Locations

```
Frontend Tests:
  src/components/__tests__/Button.test.tsx
  src/components/Button.test.tsx
  src/hooks/useAuth.test.ts
  src/services/authService.test.ts

Backend Tests:
  server/routes/__tests__/users.test.js
  server/middleware/__tests__/auth.test.js
  server/utils/__tests__/validators.test.js
  server/models/__tests__/User.test.js
```

---

## 💡 Tips

1. **Use data-testid sparingly** - Prefer semantic queries
2. **Test behavior, not implementation** - Users don't see state
3. **Keep tests focused** - One thing per test
4. **Avoid hard waits** - Use `waitFor` instead of `setTimeout`
5. **Mock external APIs** - Don't make real API calls
6. **Clean up after tests** - Use afterEach for cleanup
7. **Name tests clearly** - Describe what should happen
8. **Use setup utilities** - Extract common test logic

---

**Need more help?**
- [FRONTEND_TESTING.md](../FRONTEND_TESTING.md) - Detailed frontend guide
- [server/TESTING.md](../server/TESTING.md) - Detailed backend guide
- [Jest Docs](https://jestjs.io/)
- [React Testing Library Docs](https://testing-library.com/)
