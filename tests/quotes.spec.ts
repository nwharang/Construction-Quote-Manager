import { test, expect } from '@playwright/test';

test.describe('Quotes Page', () => {
  test('should display quotes page with create button', async ({ page }) => {
    // First navigate to the quotes page
    await page.goto('/quotes');
    
    // Check for the main heading
    const heading = await page.getByRole('heading', { name: /quotes/i }).first();
    await expect(heading).toBeVisible();
    
    // Verify the Create New Quote button is present
    const createButton = await page.getByRole('button', { name: /create new quote/i });
    await expect(createButton).toBeVisible();
  });

  test('should open create quote modal when clicking create button', async ({ page }) => {
    await page.goto('/quotes');
    
    // Click the create button
    const createButton = await page.getByRole('button', { name: /create new quote/i });
    await createButton.click();
    
    // Wait for any modal/dialog to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Check for form elements that would be inside the modal
    await expect(page.getByLabel(/project name/i)).toBeVisible();
    await expect(page.getByLabel(/customer name/i)).toBeVisible();
    
    // Look for modal buttons
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create|submit/i })).toBeVisible();
  });

  test('should close modal when clicking cancel', async ({ page }) => {
    await page.goto('/quotes');
    
    // Open the modal
    const createButton = await page.getByRole('button', { name: /create new quote/i });
    await createButton.click();
    
    // Wait for any modal/dialog to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Find and click the cancel button
    const cancelButton = await page.getByRole('button', { name: /cancel/i });
    await cancelButton.click();
    
    // Check that the modal is closed by verifying form fields are no longer visible
    await expect(page.getByLabel(/project name/i)).not.toBeVisible({ timeout: 2000 });
  });
}); 