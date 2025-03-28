import { test, expect } from '@playwright/test';

/**
 * UI Appearance Tests (Authenticated)
 * 
 * These tests verify that the UI components appear correctly on authenticated pages:
 * - Visual styling and layout
 * - @heroui/react components rendering properly
 * - Tailwind v4 compatibility
 */

// Test: Dashboard appearance
test('dashboard should have proper styling and layout', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Take a screenshot for visual verification
  await page.screenshot({ path: 'test-results/dashboard.png' });
  
  // Check for main layout components
  const header = page.locator('header').first();
  const sidebar = page.locator('nav, aside').first();
  const main = page.locator('main').first();
  
  await expect(header).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(main).toBeVisible();
  
  // Check for proper spacing between elements
  const mainPadding = await main.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      paddingLeft: parseFloat(style.paddingLeft),
      paddingRight: parseFloat(style.paddingRight),
      paddingTop: parseFloat(style.paddingTop),
      paddingBottom: parseFloat(style.paddingBottom)
    };
  });
  
  // Elements should have proper padding
  expect(mainPadding.paddingLeft).toBeGreaterThan(0);
  expect(mainPadding.paddingRight).toBeGreaterThan(0);
});

// Test: Quotes list appearance
test('quotes list should have proper table styling', async ({ page }) => {
  await page.goto('/quotes');
  
  // Take a screenshot for visual verification
  await page.screenshot({ path: 'test-results/quotes-list.png' });
  
  // Check for proper styling of the heading
  const heading = page.getByRole('heading', { name: /quotes/i }).first();
  await expect(heading).toBeVisible();
  
  // Check heading has appropriate styles
  const headingStyles = await heading.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      fontSize: parseFloat(style.fontSize),
      fontWeight: style.fontWeight,
      marginBottom: parseFloat(style.marginBottom)
    };
  });
  
  // Heading should be properly sized and spaced
  expect(headingStyles.fontSize).toBeGreaterThanOrEqual(20);
  expect(parseInt(headingStyles.fontWeight)).toBeGreaterThanOrEqual(500);
  
  // Check that buttons are properly styled with @heroui/react
  const newQuoteButton = page.getByRole('button', { name: /create|new quote/i });
  await expect(newQuoteButton).toBeVisible();
  
  // Button should have proper styling
  const buttonStyles = await newQuoteButton.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      borderRadius: parseFloat(style.borderRadius),
      backgroundColor: style.backgroundColor,
      color: style.color,
      padding: style.padding
    };
  });
  
  // Button should have rounded corners and a background color
  expect(buttonStyles.borderRadius).toBeGreaterThan(0);
  expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});

// Test: Quote details page appearance
test('quote details page should have proper styling', async ({ page }) => {
  // Navigate to the quotes page
  await page.goto('/quotes');
  
  // Click on the first quote or create one if needed
  const quoteRows = page.locator('table tbody tr, [role="table"] [role="row"], [data-testid="quote-item"]');
  const quoteCount = await quoteRows.count();
  
  if (quoteCount === 0) {
    // Create a new quote if none exist
    await page.getByRole('button', { name: /create|new quote/i }).click();
    await page.locator('input[name="projectName"]').fill('Test Project');
    await page.locator('input[name="customerName"]').fill('Test Customer');
    await page.locator('input[name="customerEmail"]').fill('test@example.com');
    await page.getByRole('button', { name: /create|save|submit/i }).click();
    
    // Wait for navigation to the quote details
    await page.waitForURL(/\/quotes\/[\w-]+/);
  } else {
    // Click on the first quote
    await quoteRows.first().click();
    await page.waitForURL(/\/quotes\/[\w-]+/);
  }
  
  // Take a screenshot of the quote details page
  await page.screenshot({ path: 'test-results/quote-details.png' });
  
  // Check for key elements on the page
  const header = page.getByText(/Project|Customer|Status/i).first();
  await expect(header).toBeVisible();
  
  // Add Task button should be styled
  const addTaskButton = page.getByRole('button', { name: /add task/i });
  if (await addTaskButton.isVisible()) {
    const buttonStyles = await addTaskButton.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderRadius: parseFloat(style.borderRadius),
        backgroundColor: style.backgroundColor,
        border: style.border
      };
    });
    
    // Button should have proper styling
    expect(buttonStyles.borderRadius).toBeGreaterThan(0);
    expect(
      buttonStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
      buttonStyles.border !== 'none'
    ).toBeTruthy();
  }
  
  // Check for card styling if tasks exist
  const taskCards = page.locator('.card, [role="listitem"], [data-testid="task-item"]');
  if (await taskCards.count() > 0) {
    const cardStyles = await taskCards.first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderRadius: parseFloat(style.borderRadius),
        boxShadow: style.boxShadow,
        margin: style.margin
      };
    });
    
    // Cards should have proper styling
    expect(cardStyles.borderRadius).toBeGreaterThan(0);
    expect(cardStyles.boxShadow).not.toBe('none');
  }
}); 