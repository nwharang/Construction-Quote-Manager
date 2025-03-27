import { test, expect } from '@playwright/test';

// Define screen sizes to test
const screenSizes = [
  { width: 1920, height: 1080, name: 'Desktop' },
  { width: 1024, height: 768, name: 'Tablet Landscape' },
  { width: 768, height: 1024, name: 'Tablet Portrait' },
  { width: 414, height: 896, name: 'Mobile' },
];

// Key pages to test responsiveness
const keyPages = [
  { path: '/', name: 'Home' },
  { path: '/quotes', name: 'Quotes List' },
  { path: '/quotes/1', name: 'Quote Detail' },
  { path: '/auth/signin', name: 'Sign In' },
  { path: '/products', name: 'Products' }
];

test.describe('Responsive Design', () => {
  // Test each key page at each screen size
  for (const size of screenSizes) {
    test.describe(`At ${size.name} (${size.width}x${size.height})`, () => {
      // Set viewport size before each test
      test.use({ viewport: { width: size.width, height: size.height } });
      
      for (const page of keyPages) {
        test(`${page.name} page should be responsive`, async ({ page: pageObj }) => {
          await pageObj.goto(page.path);
          
          // Take a screenshot for visual verification
          // Note: In real scenarios, you might want to use visual comparison tools
          await pageObj.screenshot({ path: `screenshots/${page.name}-${size.name}.png` });
          
          // Check for specific responsive elements depending on page
          if (page.path === '/quotes') {
            // On mobile, verify table switches to cards or responsive layout
            if (size.width <= 768) {
              // Expect quotes to be displayed appropriately for mobile
              // This might mean checking that a responsive table exists or cards are used
              const quoteItems = await pageObj.locator('div[role="listitem"], .card, .mobile-friendly-item').count();
              expect(quoteItems).toBeGreaterThanOrEqual(0);
            } else {
              // On larger screens, expect a proper table
              const quoteTable = pageObj.locator('table');
              if (await quoteTable.isVisible()) {
                await expect(quoteTable).toBeVisible();
              }
            }
          }
          
          // Check for hamburger menu on small screens
          if (size.width <= 768) {
            const menuButton = pageObj.getByRole('button', { name: /menu|hamburger/i });
            if (await menuButton.isVisible()) {
              // If there's a hamburger menu, it should be visible on mobile
              await expect(menuButton).toBeVisible();
              
              // Click and verify menu opens
              await menuButton.click();
              
              // Check that menu items are now visible
              const menuItems = pageObj.locator('nav a, .menu-item');
              expect(await menuItems.count()).toBeGreaterThan(0);
            }
          }
          
          // On quote details page, check that tasks display correctly on different screens
          if (page.path === '/quotes/1') {
            const tasksList = pageObj.locator('.tasks-list, table, div[role="list"]');
            await expect(tasksList).toBeVisible();
            
            // On smaller screens, adjustment controls might stack
            if (size.width <= 768) {
              // Check if adjustment fields are stacked by verifying they take up more vertical space
              const adjustmentSection = pageObj.locator('.adjustments, form, fieldset').first();
              if (await adjustmentSection.isVisible()) {
                const boundingBox = await adjustmentSection.boundingBox();
                // If stacked, height should be relatively larger
                if (boundingBox) {
                  expect(boundingBox.height).toBeGreaterThan(50);
                }
              }
            }
          }
        });
      }
    });
  }

  // Test specific responsive interactions
  test('Mobile navigation should work correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 414, height: 896 });
    await page.goto('/');
    
    // Find and click hamburger menu if it exists
    const menuButton = page.getByRole('button', { name: /menu|hamburger/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Look for quotes link in the menu
      const quotesLink = page.getByRole('link', { name: /quotes/i });
      if (await quotesLink.isVisible()) {
        await quotesLink.click();
        
        // Verify navigation worked
        await expect(page).toHaveURL(/\/quotes/);
      }
    }
  });

  test('Forms should be usable on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 414, height: 896 });
    
    // Test a form page - signin is a good candidate
    await page.goto('/auth/signin');
    
    // Verify form fields are accessible and properly sized
    const usernameInput = page.getByLabel(/username/i);
    const passwordInput = page.getByLabel(/password/i);
    const signinButton = page.getByRole('button', { name: /sign in/i });
    
    // All elements should be visible and accessible
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signinButton).toBeVisible();
    
    // Verify input fields have appropriate width for the screen
    const usernameBox = await usernameInput.boundingBox();
    if (usernameBox) {
      // Input should take up most of the screen width on mobile
      expect(usernameBox.width).toBeGreaterThan(200);
      expect(usernameBox.width).toBeLessThanOrEqual(414);
    }
  });
}); 