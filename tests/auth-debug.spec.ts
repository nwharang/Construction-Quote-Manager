import { test, expect } from '@playwright/test';

/**
 * Debug test file to check why authentication is failing
 */
test('debug demo user authentication', async ({ page }) => {
  // Navigate to the sign-in page
  await page.goto('/auth/signin');
  
  // Wait for the form to be visible and take a screenshot
  await page.waitForSelector('form', { state: 'visible' });
  await page.screenshot({ path: 'debug-signin-form.png' });
  
  console.log('Form visible, filling email...');
  await page.locator('input[name="email"]').fill('demo@example.com');
  
  console.log('Filling password...');
  await page.locator('input[name="password"]').fill('Password123!');
  
  console.log('Taking screenshot before clicking sign in...');
  await page.screenshot({ path: 'debug-before-submit.png' });
  
  console.log('Clicking sign-in button...');
  await page.locator('button[type="submit"]').click();
  
  console.log('Waiting for navigation...');
  try {
    await page.waitForURL(/\/(quotes|dashboard)/, { timeout: 5000 });
    console.log('Successfully navigated to dashboard or quotes page!');
  } catch (error) {
    console.log('Navigation timeout. Current URL:', page.url());
    await page.screenshot({ path: 'debug-after-submit-fail.png' });
    
    // Check if there are any error messages
    const errorText = await page.locator('.text-danger, .error, [role="alert"]').textContent();
    console.log('Error message if any:', errorText);
  }
}); 