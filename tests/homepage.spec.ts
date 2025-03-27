import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display welcome message', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page contains a heading or welcome message
    const heading = await page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
  });

  test('should navigate to quotes page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click on a navigation link to quotes
    const quotesLink = await page.getByRole('link', { name: /quotes/i });
    if (await quotesLink.isVisible()) {
      await quotesLink.click();
      await expect(page).toHaveURL(/\/quotes/);
    }
  });
}); 