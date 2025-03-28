import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup file that runs before all tests.
 * This handles authentication once and saves the state for all tests to use.
 */
setup('authenticate', async ({ page }) => {
  // Create the auth directory if it doesn't exist
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Clear any existing storage state
  const storageStatePath = path.join(authDir, 'storage-state.json');
  try {
    if (fs.existsSync(storageStatePath)) {
      fs.unlinkSync(storageStatePath);
    }
  } catch (error) {
    console.error('Failed to clear existing storage state:', error);
  }

  // Navigate to the sign-in page
  await page.goto('/auth/signin');
  
  // Ensure we're on the login page
  await page.waitForSelector('form', { state: 'visible' });
  
  // Fill in the demo credentials - use more specific selectors
  await page.locator('input[name="email"]').fill('demo@example.com');
  await page.locator('input[name="password"]').fill('Password123!');
  
  // Click the sign-in button - use more specific selector
  await page.locator('button[type="submit"]').click();
  
  // Wait for navigation to complete indicating successful login
  await page.waitForURL(/\/(quotes|dashboard)/, { timeout: 10000 });
  
  // Verify we're authenticated by checking for a dashboard or quotes element
  await page.waitForSelector('h1', { state: 'visible' });
  
  // Save the authentication state to be used in other tests
  await page.context().storageState({ path: storageStatePath });
  console.log(`Authentication state saved to ${storageStatePath}`);
}); 