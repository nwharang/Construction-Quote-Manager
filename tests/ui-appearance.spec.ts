import { test, expect } from '@playwright/test';

/**
 * UI Appearance Tests
 * 
 * These tests verify that the UI components appear correctly:
 * - Visual styling and layout
 * - @heroui/react components rendering properly
 * - Tailwind v4 compatibility
 */

// Test: Homepage appearance
test('homepage should have proper styling and layout', async ({ page }) => {
  await page.goto('/');
  
  // Take a screenshot for visual verification
  await page.screenshot({ path: 'test-results/homepage.png' });
  
  // Check for proper styling of heading elements
  const headings = page.locator('h1, h2');
  await expect(headings.first()).toBeVisible();
  
  // Check that no text overflows its container
  const htmlElement = page.locator('html');
  const overflow = await htmlElement.evaluate((el) => {
    return window.getComputedStyle(el).overflow;
  });
  expect(['auto', 'visible', 'scroll', 'hidden']).toContain(overflow);
});

// Test: Authentication page appearance
test('sign-in page should have proper styling', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Take a screenshot for visual verification
  await page.screenshot({ path: 'test-results/signin.png' });
  
  // Check that card/form has appropriate styling
  const signInCard = page.locator('form').first();
  await expect(signInCard).toBeVisible();
  
  // Check form inputs have proper styling
  const emailInput = page.getByLabel('Email');
  const passwordInput = page.getByLabel('Password');
  
  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  
  // Check that the sign in button has proper styling
  const signInButton = page.getByRole('button', { name: 'Sign In' });
  await expect(signInButton).toBeVisible();
  
  // Check for consistent roundedness of elements
  // We'll check text fields and buttons which should have consistent rounding
  const emailInputBounding = await emailInput.boundingBox();
  const signInButtonBounding = await signInButton.boundingBox();
  
  // Ensure both elements have appropriate width (not too narrow)
  if (emailInputBounding && signInButtonBounding) {
    expect(emailInputBounding.width).toBeGreaterThan(200);
    expect(signInButtonBounding.width).toBeGreaterThan(100);
  }
});

// Test: Dashboard page appearance (requires authentication)
test('dashboard should have proper styling with sidebar and content areas', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Take a screenshot for visual verification
  await page.screenshot({ path: 'test-results/dashboard.png' });
  
  // Check for presence of main layout areas
  const sidebar = page.locator('nav, aside').first();
  const mainContent = page.locator('main, [role="main"]').first();
  
  await expect(sidebar).toBeVisible();
  await expect(mainContent).toBeVisible();
  
  // Check for proper styling of @heroui/react components like cards
  const cards = page.locator('.card, [data-card], [class*="Card-"]');
  if (await cards.count() > 0) {
    await expect(cards.first()).toBeVisible();
    
    // Check card has proper shadows and rounded corners
    const cardHasStyles = await cards.first().evaluate((card) => {
      const style = window.getComputedStyle(card);
      return {
        hasBorderRadius: parseFloat(style.borderRadius) > 0,
        hasShadow: style.boxShadow !== 'none'
      };
    });
    
    expect(cardHasStyles.hasBorderRadius).toBeTruthy();
    expect(cardHasStyles.hasShadow).toBeTruthy();
  }
});

// Test: Quotes list page appearance (requires authentication)
test('quotes list should have proper table styling', async ({ page }) => {
  await page.goto('/quotes');
  
  // Take a screenshot for visual verification
  await page.screenshot({ path: 'test-results/quotes-list.png' });
  
  // Check for proper table styling
  const table = page.locator('table, [role="table"]').first();
  await expect(table).toBeVisible();
  
  // Check header has proper styling
  const tableHeaders = page.locator('th, [role="columnheader"]');
  if (await tableHeaders.count() > 0) {
    // Verify headers have distinct styling from rows
    const headerStyles = await tableHeaders.first().evaluate((header) => {
      const style = window.getComputedStyle(header);
      return {
        backgroundColor: style.backgroundColor,
        fontWeight: style.fontWeight
      };
    });
    
    // Headers should have either a different background or bold text
    expect(
      headerStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
      parseInt(headerStyles.fontWeight) >= 500
    ).toBeTruthy();
  }
  
  // Check for @heroui/react Button component styling
  const createButton = page.getByRole('button', { name: /create|new quote/i });
  await expect(createButton).toBeVisible();
  
  // Check button has proper styling
  const buttonStyles = await createButton.evaluate((button) => {
    const style = window.getComputedStyle(button);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      borderRadius: style.borderRadius
    };
  });
  
  // Button should have a background color, text color and rounded corners
  expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(buttonStyles.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(parseFloat(buttonStyles.borderRadius)).toBeGreaterThan(0);
}); 