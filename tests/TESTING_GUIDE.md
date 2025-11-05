# Testing Guide - Christmas Wishlist Application

## Quick Start

```bash
# Install dependencies
cd tests
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Test Categories

### 1. Unit Tests (`/tests/unit/`)

**Purpose**: Test individual functions and components in isolation

**Coverage:**
- ✅ Metadata extraction utilities (Amazon, Target, generic URLs)
- ✅ Database helper functions (CRUD operations)
- ✅ React components (WishlistItem, forms, UI elements)

**Example:**
```typescript
describe('extractAmazonMetadata', () => {
  it('should extract ASIN from Amazon URL', () => {
    const url = 'https://www.amazon.com/dp/B08N5WRWNW';
    const result = extractAmazonMetadata(url);
    expect(result.asin).toBe('B08N5WRWNW');
  });
});
```

### 2. Integration Tests (`/tests/integration/`)

**Purpose**: Test multiple components working together

**Coverage:**
- ✅ API routes (lists, items, locations)
- ✅ Database operations with mocked Supabase
- ✅ Authentication flows (register, login, session management)

**Example:**
```typescript
describe('POST /api/lists', () => {
  it('should create a new list', async () => {
    const response = await createList({
      title: 'Christmas 2024',
      location_id: 'loc-123',
    });
    expect(response.status).toBe(201);
    expect(response.data.title).toBe('Christmas 2024');
  });
});
```

### 3. E2E Tests (`/tests/e2e/`)

**Purpose**: Test complete user journeys in a real browser

**Coverage:**
- ✅ User registration and login flows
- ✅ Creating locations and lists
- ✅ Adding items via URL parsing
- ✅ Sharing lists with permissions
- ✅ Mobile responsiveness
- ✅ Search and filter functionality

**Example:**
```typescript
test('should complete registration flow', async ({ page }) => {
  await page.goto('/register');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/verify-email');
});
```

## Test Structure

### Arrange-Act-Assert Pattern

```typescript
it('should update list title', async () => {
  // Arrange: Setup test data
  const list = createMockList();
  
  // Act: Perform the operation
  const updated = await updateList(list.id, { title: 'New Title' });
  
  // Assert: Verify the result
  expect(updated.title).toBe('New Title');
});
```

### Using Test Helpers

```typescript
import { generateMockUser, createTestDatabase } from '../test-helpers/setup';

const db = createTestDatabase();
const user = db.addUser({ email: 'test@example.com' });
const location = db.addLocation(user.id);
const list = db.addList(location.id, user.id);
```

## Coverage Reports

### Viewing Coverage

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Thresholds

All modules must meet these minimums:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## Debugging Tests

### Jest Debug

```bash
# Debug specific test
npm test -- -t "test name"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Run single file
npm test -- unit/utils/metadata-extractor.test.ts
```

### Playwright Debug

```bash
# Debug mode with browser open
npm run test:e2e:debug

# Run headed (see browser)
npm run test:e2e:headed

# Specific test file
npx playwright test e2e/user-flows.spec.ts
```

## Writing New Tests

### 1. Create Test File

```bash
# Unit test
touch tests/unit/components/my-component.test.tsx

# Integration test
touch tests/integration/api/my-endpoint.test.ts

# E2E test
touch tests/e2e/my-flow.spec.ts
```

### 2. Follow Template

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Happy Path', () => {
    it('should work with valid input', () => {
      // Test implementation
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      // Test implementation
    });

    it('should handle special characters', () => {
      // Test implementation
    });
  });

  describe('Error Handling', () => {
    it('should throw on invalid input', () => {
      // Test implementation
    });
  });
});
```

### 3. Add Test Documentation

```typescript
/**
 * Tests for metadata extraction from product URLs
 * Covers:
 * - Amazon URL parsing
 * - Target URL parsing
 * - Generic URL fallback
 * - Edge cases and error handling
 */
```

## Best Practices

### ✅ Do

- Write descriptive test names
- Test one thing per test
- Use beforeEach for setup
- Clean up after tests
- Mock external dependencies
- Test edge cases
- Use data-testid for selectors
- Keep tests fast (<100ms for unit)

### ❌ Don't

- Test implementation details
- Share state between tests
- Use timeouts for async
- Duplicate test logic
- Hardcode test data
- Skip failing tests
- Test multiple scenarios in one test

## Common Patterns

### Async Testing

```typescript
it('should fetch data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Error Testing

```typescript
it('should throw on invalid input', () => {
  expect(() => myFunction(invalid)).toThrow('Error message');
});

it('should reject with error', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error');
});
```

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

it('should render component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

it('should handle click', () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick} />);
  fireEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalled();
});
```

### Mock Functions

```typescript
const mockFunction = jest.fn();
mockFunction.mockReturnValue('value');
mockFunction.mockResolvedValue('async value');
mockFunction.mockRejectedValue(new Error('error'));

expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith('arg');
expect(mockFunction).toHaveBeenCalledTimes(2);
```

## CI/CD Integration

Tests automatically run on:
- Every pull request
- Push to main branch
- Pre-deployment

### Required Checks

All of these must pass:
1. Unit tests (with 80% coverage)
2. Integration tests
3. E2E tests on Chrome/Firefox
4. Linting
5. Type checking

## Troubleshooting

### Common Issues

**Timeout Errors:**
```typescript
// Increase timeout for slow operations
test('slow test', async () => {
  // ...
}, 10000); // 10 seconds
```

**Memory Leaks:**
```typescript
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

**Flaky Tests:**
```typescript
// Use waitFor for async elements
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

**Mock Not Working:**
```typescript
// Mock before import
jest.mock('@/lib/supabase');
import { supabase } from '@/lib/supabase';
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Getting Help

- Review existing tests for examples
- Check test output for detailed errors
- Use `--verbose` flag for more details
- Ask team members for guidance
