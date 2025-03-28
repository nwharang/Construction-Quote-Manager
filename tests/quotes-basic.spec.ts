// Import the Playwright test utilities
import { test, expect } from '@playwright/test';

/**
 * Basic Quote Tests 
 * 
 * These are simplified tests for the quotes page that can run
 * without authentication by checking for redirects to login.
 */

// Test redirect behavior when accessing quotes page without authentication
test('quotes page should redirect to login when unauthenticated', async ({ page }) => {
  // Try to access the quotes page directly
  await page.goto('/quotes');
  
  // Should be redirected to the sign-in page
  await expect(page).toHaveURL(/.*signin/);
  
  // Sign-in page elements should be visible
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

// Test redirect behavior when accessing quote creation page without authentication
test('quote creation page should redirect to login when unauthenticated', async ({ page }) => {
  // Try to access the quote creation page directly
  await page.goto('/quotes/new');
  
  // Should be redirected to the sign-in page
  await expect(page).toHaveURL(/.*signin/);
});

// Test redirect behavior when accessing a specific quote without authentication
test('quote details page should redirect to login when unauthenticated', async ({ page }) => {
  // Try to access a quote details page with a made-up ID
  await page.goto('/quotes/test-quote-id');
  
  // Should be redirected to the sign-in page
  await expect(page).toHaveURL(/.*signin/);
}); 