# Christmas Wishlist Application - Test Suite

Comprehensive test suite for the Christmas wishlist application with 80%+ code coverage.

## Directory Structure

```
tests/
├── unit/                    # Unit tests
│   ├── utils/              # Utility function tests
│   ├── database/           # Database helper tests
│   └── components/         # React component tests
├── integration/            # Integration tests
│   ├── api/               # API route tests
│   ├── database/          # Database operation tests
│   └── auth/              # Authentication flow tests
├── e2e/                   # End-to-end tests
│   └── *.spec.ts          # Playwright E2E tests
├── test-helpers/          # Shared test utilities
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Jest setup file
└── playwright.config.ts   # Playwright configuration
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- unit
```

### Integration Tests Only
```bash
npm test -- integration
```

### E2E Tests
```bash
npm run test:e2e
```

### With Coverage
```bash
npm test -- --coverage
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

## Test Coverage Goals

- **Statements**: ≥80%
- **Branches**: ≥80%
- **Functions**: ≥80%
- **Lines**: ≥80%

## Writing Tests

### Unit Tests
Unit tests should be isolated and fast. Mock external dependencies.

```typescript
import { describe, it, expect } from '@jest/globals';

describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('output');
  });
});
```

### Integration Tests
Integration tests test multiple components together.

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('API Integration', () => {
  beforeEach(() => {
    // Setup test database
  });

  it('should create and fetch resource', async () => {
    const created = await createResource(data);
    const fetched = await fetchResource(created.id);
    expect(fetched).toEqual(created);
  });
});
```

### E2E Tests
E2E tests simulate real user flows with Playwright.

```typescript
import { test, expect } from '@playwright/test';

test('user can complete registration', async ({ page }) => {
  await page.goto('/register');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/verify-email');
});
```

## Test Helpers

Use shared test utilities from `test-helpers/`:

```typescript
import { generateMockUser, createTestDatabase } from '../test-helpers/setup';

const user = generateMockUser({ email: 'custom@example.com' });
const db = createTestDatabase();
db.addUser(user);
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Pre-deployment

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run test:e2e
```

## Debugging Tests

### Debug Single Test
```bash
npm test -- -t "test name"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debug Mode
```bash
npx playwright test --debug
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One Assertion Per Test**: Keep tests focused
3. **Descriptive Names**: Use clear test descriptions
4. **Mock External Dependencies**: Isolate units
5. **Clean Up**: Reset state between tests
6. **Fast Tests**: Unit tests should be <100ms
7. **Deterministic**: Tests should always pass/fail the same way

## Common Issues

### Async Timeout
Increase timeout for slow operations:
```typescript
test('slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Memory Leaks
Clean up after tests:
```typescript
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

### Flaky Tests
Use `waitFor` for async operations:
```typescript
await waitFor(() => expect(element).toBeVisible());
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
