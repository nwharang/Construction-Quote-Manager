// Import the Playwright test utilities
import { test, expect } from '@playwright/test';

/**
 * Basic tests that don't require authentication
 */

// Test homepage loads properly
test('homepage should load successfully', async ({ page }) => {
  await page.goto('/');
  
  // Check for expected homepage content
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();
  
  // Take a screenshot of the homepage
  await page.screenshot({ path: 'test-results/homepage-basic.png' });
});

// Test sign-in page loads
test('sign-in page should load and have proper form elements', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Check for key form elements - using both ID and name selectors for better reliability
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');
  const submitButton = page.locator('button[type="submit"]');
  
  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(submitButton).toBeVisible();
  
  // Take a screenshot of the sign-in page
  await page.screenshot({ path: 'test-results/signin-basic.png' });
}); 