# Jest Testing Setup Guide - Frontend

## ✅ Complete Setup

### Installed Packages
- `jest` - Testing framework
- `ts-jest` - TypeScript support for Jest
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `jest-environment-jsdom` - DOM environment for component testing
- `identity-obj-proxy` - CSS module mocking

### Files Created

1. **jest.config.js** - Jest configuration file (root)
2. **src/setupTests.ts** - Test setup file with testing library config

### Test File Locations

Create test files using one of these patterns:

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx              # ✅ Preferred
│   └── __tests__/Button.test.tsx    # ✅ Also valid
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
├── services/
│   ├── authService.ts
│   └── authService.test.ts
└── setupTests.ts
```

## 📋 Available Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="Button"

# Update snapshots
npm test -- -u

# Run in CI mode (no watch)
npm test -- --ci
```

## 📝 Test Structure

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick handler', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

### Hook Test Example

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth Hook', () => {
  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('should update user on login', async () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.login('test@example.com');
    });
    
    expect(result.current.user).toBeDefined();
  });
});
```

### Service Test Example

```typescript
import { authService } from './authService';

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate email format', () => {
    expect(authService.validateEmail('test@example.com')).toBe(true);
    expect(authService.validateEmail('invalid')).toBe(false);
  });

  it('should hash password', async () => {
    const hash = await authService.hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(hash).toHaveLength(60);
  });
});
```

## 🔍 Common Testing Patterns

### Querying Elements

```typescript
// By Role (preferred)
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });

// By Label
screen.getByLabelText(/email/i);

// By Placeholder
screen.getByPlaceholderText(/search/i);

// By Text
screen.getByText(/welcome/i);

// By Test ID
screen.getByTestId('custom-element');

// Query (returns null if not found)
screen.queryByRole('button');

// Find (async, waits for element)
await screen.findByRole('button');
```

### User Interactions

```typescript
import userEvent from '@testing-library/user-event';

// Setup user
const user = userEvent.setup();

// Click
await user.click(button);

// Type
await user.type(input, 'hello');

// Clear
await user.clear(input);

// Select Option
await user.selectOptions(select, 'option1');

// Hover
await user.hover(element);

// Keyboard
await user.keyboard('{Enter}');
```

### Async Operations

```typescript
// Wait for element to appear
await screen.findByRole('button');

// Wait for condition
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument();
});

// Wait for specific timeout
await waitFor(
  () => expect(element).toHaveValue('new value'),
  { timeout: 3000 }
);
```

### Mocking

```typescript
// Mock module
jest.mock('../api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'test' })
}));

// Mock function
const mockFn = jest.fn();
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value');
mockFn.mockRejectedValue(new Error('error'));

// Reset mocks
jest.clearAllMocks();
mockFn.mockClear();
```

## 🧪 Common Assertions

```typescript
// DOM Elements
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toHaveClass('active');
expect(element).toHaveValue('text');
expect(element).toHaveAttribute('href', '/path');

// Text Content
expect(element).toHaveTextContent('hello');
expect(screen.getByText(/pattern/i)).toBeInTheDocument();

// Style
expect(element).toHaveStyle('color: red');

// Children
expect(container).toContainElement(child);
expect(element).toHaveFormValues({ email: 'test@example.com' });
```

## 📊 Coverage Report

Run coverage analysis:

```bash
npm run test:coverage
```

Coverage report will be available in `coverage/` directory.

View coverage summary:
```bash
open coverage/lcov-report/index.html
```

## 🚀 Best Practices

1. **Test User Behavior** - Not implementation details
   ```typescript
   // ❌ Bad - Testing implementation
   expect(component.state.isLoaded).toBe(true);
   
   // ✅ Good - Testing behavior
   expect(screen.getByText('Loaded')).toBeInTheDocument();
   ```

2. **Use Semantic Queries** - In order of preference
   ```
   1. getByRole - Most accessible
   2. getByLabelText - Form fields
   3. getByPlaceholderText - Inputs
   4. getByText - Generic text
   5. getByTestId - Last resort
   ```

3. **Write Meaningful Test Names**
   ```typescript
   // ✅ Good
   it('should display loading spinner while fetching data', () => {});
   it('should disable submit button when form is invalid', () => {});
   ```

4. **Mock External Dependencies**
   ```typescript
   jest.mock('../api/client', () => ({
     fetchUser: jest.fn()
   }));
   ```

5. **Keep Tests Isolated**
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

6. **Test Edge Cases**
   ```typescript
   it('should handle empty data', () => {});
   it('should handle null props', () => {});
   it('should handle errors', () => {});
   ```

## 🐛 Debugging Tests

Run a specific test:
```bash
npm test -- Button.test.tsx
```

Run with verbose output:
```bash
npm test -- --verbose
```

Run in debug mode:
```bash
node --inspect-brk node_modules/jest/bin/jest.js --runInBand
```

## 🔗 Testing Context Providers

```typescript
import { AuthProvider } from './AuthContext';

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('Protected Component', () => {
  it('should render with auth context', () => {
    renderWithAuth(<ProtectedComponent />);
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });
});
```

## ✨ Next Steps

1. Create test files for React components
2. Write tests for custom hooks
3. Test API service functions
4. Set up CI/CD pipeline to run tests
5. Aim for >80% code coverage
6. Add E2E tests with Cypress/Playwright

---

For more information:
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
