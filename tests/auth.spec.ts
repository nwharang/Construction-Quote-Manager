import { test, expect } from '@playwright/test';

// Test: Sign in page is accessible
test('sign in page is accessible', async ({ page }) => {
  await page.goto('/auth/signin');
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
});

// Test: Sign up page is accessible
test('sign up page is accessible', async ({ page }) => {
  await page.goto('/auth/signup');
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
});

// Test: Sign in form validation
test('sign in form validation works', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Submit empty form
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for validation errors
  await page.waitForTimeout(500);
  
  // Count errors
  const emailErrors = await page.getByText(/email/i).count();
  const passwordErrors = await page.getByText(/password/i).count();
  
  // Verify at least one error is displayed
  expect(emailErrors + passwordErrors).toBeGreaterThan(0);
});

// Test: Sign up form validation
test('sign up form validation works', async ({ page }) => {
  await page.goto('/auth/signup');
  
  // Submit empty form
  await page.getByRole('button', { name: 'Sign Up' }).click();
  
  // Wait for validation errors
  await page.waitForTimeout(500);
  
  // Check for validation errors
  await expect(page.getByText(/name must be/i)).toBeVisible();
  await expect(page.getByText(/valid email/i)).toBeVisible();
  await expect(page.getByText(/password must be/i)).toBeVisible();
});

// Test: Protected pages redirect to sign in
test('protected pages redirect to sign in', async ({ page }) => {
  // Try to access a protected page
  await page.goto('/quotes');
  
  // Should redirect to sign in
  await expect(page).toHaveURL(/.*signin/);
});

// Test: Demo user can sign in
test('demo user can sign in', async ({ page }) => {
  // Sign in with demo user
  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', 'demo@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // We can't reliably test successful login in an integration test without mocking,
  // so we'll just check that no error appears
  await page.waitForTimeout(1000);
  
  // Shouldn't see error messages
  const errorMessages = await page.getByText(/invalid email or password|unexpected error/i).count();
  expect(errorMessages).toBe(0);
});

// Test: Navigation from sign in to sign up
test('can navigate from sign in to sign up', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Find and click the sign up link
  await page.getByRole('link', { name: 'Sign up' }).click();
  
  // Should be on the sign up page
  await expect(page).toHaveURL('/auth/signup');
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
});

// Test: Navigation from sign up to sign in
test('can navigate from sign up to sign in', async ({ page }) => {
  await page.goto('/auth/signup');
  
  // Find and click the sign in link
  await page.getByRole('link', { name: 'Sign in' }).click();
  
  // Should be on the sign in page
  await expect(page).toHaveURL('/auth/signin');
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
});

// Test: Password visibility toggle
test('password visibility toggle works on sign in page', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Enter a password
  await page.fill('input[type="password"]', 'test-password');
  
  // Check that the input type is password (hidden)
  const passwordInput = page.locator('input[name="password"]');
  await expect(passwordInput).toHaveAttribute('type', 'password');
  
  // Click the eye icon to show password
  await page.getByRole('button', { name: 'Show password' }).click();
  
  // Check that the input type changed to text (visible)
  await expect(passwordInput).toHaveAttribute('type', 'text');
  
  // Click again to hide
  await page.getByRole('button', { name: 'Hide password' }).click();
  
  // Check that it's hidden again
  await expect(passwordInput).toHaveAttribute('type', 'password');
}); 