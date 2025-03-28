# Testing Strategy for Construction Quote Manager

This document outlines the testing approach for the Construction Quote Manager application.

## Important Notes on Authentication

There are currently some limitations with automated authentication:

1. **Authentication Issues**: The NextAuth authentication flow might not work consistently in automated tests due to various factors (session handling, cookies, redirects).

2. **Recommended Approach**:
   - Run unauthenticated tests with `pnpm test:basic` for reliable results
   - For authenticated tests, use the preparation script first: `pnpm test:prepare`
   - Examine the results and state to debug authentication issues

3. **Manual Authentication**: If automated authentication fails, you can:
   - Start the development server: `pnpm dev`
   - Manually log in using the UI
   - Use browser devtools to extract cookies and session data
   - Create a storage state file manually at `tests/.auth/storage-state.json`

## Test Types and File Structure

We organize our tests into several categories:

1. **Basic Unauthenticated Tests (`*-basic.spec.ts`)**
   - Test public pages and redirection behavior
   - Do not require authentication
   - Example: `quotes-basic.spec.ts`

2. **UI/Display Tests (`ui-appearance.spec.ts`, `ui-components.spec.ts`)**
   - Test styling and appearance of components
   - Some may require authentication (use `.auth.spec.ts` suffix)
   - Example: `ui-appearance.spec.ts`, `ui-components.spec.ts`

3. **Feature Tests (`*.spec.ts`)**
   - Test specific functionality
   - May require authentication (use `.auth.spec.ts` suffix)
   - Examples: `quotes.spec.ts`, `auth.spec.ts`

4. **Authenticated Tests (`*.auth.spec.ts`)**
   - Tests that require an authenticated session
   - Use Playwright's storage state for authentication
   - Examples: `quotes.auth.spec.ts`, `product.auth.spec.ts`

## Authentication Approach

For tests requiring authentication:

1. **Option 1: Use Auth-Specific Test Files**
   - Create files with `.auth.spec.ts` suffix
   - Will automatically use the authenticated storage state

2. **Option 2: Use Auth Utility Function**
   - Import and use the `authenticateUser()` function from `utils.ts`
   - This authenticates for a single test

3. **Option 3: Manual Authentication State**
   - Manually create a storage state file with proper cookies/session data
   - Place it in `tests/.auth/storage-state.json`

## Running Tests

```bash
# Prepare authentication state (recommended before authenticated tests)
pnpm test:prepare

# Run all tests
pnpm test

# Run only basic tests that don't require authentication
pnpm test:basic

# Run specific test file
pnpm exec playwright test tests/quotes-basic.spec.ts

# Run tests with UI
pnpm exec playwright test --ui

# Run tests with browser visible
pnpm exec playwright test --headed

# View test report
pnpm exec playwright show-report
```

## Storage State Setup

The global setup script (`global.setup.ts`) handles authentication and saves the storage state to:
```
tests/.auth/storage-state.json
```

To debug authentication issues, check:
1. The authentication implementation in `src/app/api/auth/[...nextauth]/auth.ts`
2. The demo user credentials match what's expected
3. The storage state file exists and contains valid session data

## Debugging Tips

1. Use `--headed` flag to see the browser during test execution
2. Add `page.pause()` to stop at a certain point in the test
3. Use screenshots with `await page.screenshot({ path: 'debug.png' })`
4. Check the developer console for any JavaScript errors
5. Run the debug test with `pnpm exec playwright test tests/auth-debug.spec.ts --headed`
6. Check browser devtools Network tab to see if authentication requests are succeeding

## Test Structure

The tests are structured as follows:

- **Authentication Approach**: 
  - Regular tests (*.spec.ts) run without authentication
  - Authenticated tests (*.auth.spec.ts) use the storage state from the setup
- **Simple Test Pattern**: Each test is a direct test function rather than nested describes to avoid version conflicts.
- **Helper Utilities**: Common operations are extracted to utility functions for reuse.

## Test Files

| File | Description |
|------|-------------|
| `global.setup.ts` | Global authentication setup that runs before all tests |
| `utils.ts` | Utility functions for common operations |
| `auth.spec.ts` | Tests for authentication functionality |
| `quotes.spec.ts` | Tests for quote management |
| `quotes.auth.spec.ts` | Authenticated tests for quote management |
| `products.spec.ts` | Tests for product management |
| `task-management.spec.ts` | Tests for task management within quotes |
| `form-validation.spec.ts` | Tests for form validation across the app |
| `accessibility.spec.ts` | Tests for accessibility compliance |
| `responsive.spec.ts` | Tests for responsive design |
| `ui-appearance.spec.ts` | Tests for UI visual appearance |
| `auth-basic.spec.ts` | Simplified authentication tests |
| `quotes-basic.spec.ts` | Simplified quote management tests |
| `basic.spec.ts` | Basic tests for core functionality |

## Screenshots

Screenshots are captured during UI appearance tests and stored in the `test-results` directory. These can be used to verify visual appearance issues.

## Best Practices

1. **Keep Tests Independent**: Each test should be independent and not rely on the state from previous tests.
2. **Use Helper Functions**: Reuse common operations through helper functions in `utils.ts`.
3. **Use Simple Patterns**: Avoid nested describe blocks to prevent version conflicts.
4. **Test Real User Flows**: Structure tests to mimic actual user behavior.
5. **Use the Data Test Attributes**: Use `data-testid` attributes for more reliable element selection.
6. **Use Specific Selectors**: Target elements with specific selectors (input[name="email"]) rather than ambiguous ones (getByLabel('Email')). 