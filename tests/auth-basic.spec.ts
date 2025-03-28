// Import the Playwright test utilities
import { test, expect } from '@playwright/test';

/**
 * Basic authentication tests that don't depend on successful login
 * These verify the auth UI works properly without requiring real authentication
 */

// Test: Login page displays correctly
test('login page should display form elements correctly', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Check basic form elements
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

// Test: Password visibility toggle
test('password visibility toggle should work', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Enter password
  const passwordField = page.locator('input[name="password"]');
  await passwordField.fill('Password123!');
  
  // Find and click visibility toggle
  const toggleButton = page.getByRole('button', { name: /show password/i });
  if (await toggleButton.isVisible()) {
    await toggleButton.click();
    
    // Check if password becomes visible (type="text")
    const passwordType = await passwordField.getAttribute('type');
    expect(passwordType === 'text' || passwordType === null).toBeTruthy();
  }
});

// Test: Form validation works
test('login form should validate required fields', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Submit empty form
  await page.locator('button[type="submit"]').click();
  
  // Check for validation messages without asserting specific text
  await expect(page.getByText(/required|email|invalid/i)).toBeVisible();
});

// Test: Registration link works
test('sign up link should navigate to registration page', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Find and click sign up link
  const signUpLink = page.getByRole('link', { name: /sign up|create account/i });
  await signUpLink.click();
  
  // Check we're on the sign up page
  await expect(page.url()).toContain('/auth/signup');
  await expect(page.locator('input[name="email"]')).toBeVisible();
});

// Test authentication flow
test('should allow login with demo credentials', async ({ page }) => {
  // Navigate to the sign-in page
  await page.goto('/auth/signin');
  
  // Verify the sign-in page is displayed
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  
  // Fill in demo credentials
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('Password123!');
  
  // Click the sign-in button
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for navigation to complete
  await page.waitForURL(/\/(quotes|dashboard)/);
  
  // Verify successful authentication
  await expect(page.getByText(/dashboard|quotes/i)).toBeVisible();
});

// Test navigate to quotes after authentication
test('should navigate to quotes page after login', async ({ page }) => {
  // Navigate to the sign-in page
  await page.goto('/auth/signin');
  
  // Fill in demo credentials
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('Password123!');
  
  // Click the sign-in button
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for navigation to complete
  await page.waitForURL(/\/(quotes|dashboard)/);
  
  // Navigate to the quotes page
  await page.goto('/quotes');
  
  // Check for quotes page indicators
  await expect(page.getByRole('heading', { name: /quotes/i })).toBeVisible();
}); 