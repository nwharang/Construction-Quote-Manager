import { test, expect } from '@playwright/test';

const keyPages = [
  { path: '/', name: 'Home' },
  { path: '/quotes', name: 'Quotes List' },
  { path: '/quotes/1', name: 'Quote Detail' },
  { path: '/auth/signin', name: 'Sign In' },
  { path: '/products', name: 'Products' }
];

// Test: Homepage should have proper semantic structure
test('Home page should have proper semantic structure', async ({ page }) => {
  await page.goto('/');
  
  // Check for proper heading structure - should have h1
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBeGreaterThan(0);
  
  // Check for proper main content area with role="main"
  await expect(page.locator('main[role="main"]')).toBeVisible();
  
  // Navigation should be present with appropriate role
  await expect(page.locator('nav[role="navigation"]')).toBeVisible();
  
  // Check for proper document structure
  const docStructure = await page.evaluate(() => {
    return {
      hasHtml: !!document.querySelector('html[lang]'),
      hasTitle: !!document.querySelector('title'),
    };
  });
  
  // HTML should have lang attribute
  expect(docStructure.hasHtml).toBeTruthy();
  
  // Page should have a title
  expect(docStructure.hasTitle).toBeTruthy();
});

// Test: Sign In page should have proper semantic structure
test('Sign In page should have proper semantic structure', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Check for proper heading structure - should have h1
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBeGreaterThan(0);
  
  // Check for proper main content area with role="main"
  await expect(page.locator('main[role="main"]')).toBeVisible();
  
  // Check for proper document structure
  const docStructure = await page.evaluate(() => {
    return {
      hasHtml: !!document.querySelector('html[lang]'),
      hasTitle: !!document.querySelector('title'),
    };
  });
  
  // HTML should have lang attribute
  expect(docStructure.hasHtml).toBeTruthy();
  
  // Page should have a title
  expect(docStructure.hasTitle).toBeTruthy();
});

// Test: Interactive elements should be keyboard accessible
test('interactive elements should be keyboard accessible', async ({ page }) => {
  // Test quotes page which should have multiple interactive elements
  await page.goto('/quotes');
  
  // Tab through the page and check focus indicators
  await page.keyboard.press('Tab');
  
  // The focused element should be visible
  const focusedElement = page.locator(':focus');
  await expect(focusedElement).toBeVisible();
  
  // Continue tabbing and verify we can reach main interactive elements
  let foundInteractiveElement = false;
  
  // Tab through the page up to 20 times looking for an interactive element
  for (let i = 0; i < 20; i++) {
    const element = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? {
        tagName: el.tagName,
        ariaLabel: el.getAttribute('aria-label'),
        role: el.getAttribute('role'),
        text: el.textContent?.trim()
      } : null;
    });
    
    // Check if we've focused on an interactive element
    if (element && ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      foundInteractiveElement = true;
      
      // Expect interactive elements to have accessible names
      const hasName = element.ariaLabel || element.text;
      expect(hasName).toBeTruthy();
      break;
    }
    
    await page.keyboard.press('Tab');
  }
  
  expect(foundInteractiveElement).toBeTruthy();
});

// Test: Form inputs should have proper labels
test('form inputs should have proper labels', async ({ page }) => {
  // Check auth signin form
  await page.goto('/auth/signin');
  
  // Check that form fields have associated labels or aria-labels
  const formFields = page.locator('input:visible');
  const count = await formFields.count();
  
  // There should be at least some visible form fields
  expect(count).toBeGreaterThan(0);
  
  let allFieldsLabeled = true;
  
  for (let i = 0; i < count; i++) {
    const field = formFields.nth(i);
    
    // Get field attributes
    const id = await field.getAttribute('id');
    const ariaLabel = await field.getAttribute('aria-label');
    const ariaLabelledBy = await field.getAttribute('aria-labelledby');
    const hasLabelElement = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
    
    // Field should have at least one proper labeling method
    const hasProperLabel = !!(ariaLabel || ariaLabelledBy || hasLabelElement);
    if (!hasProperLabel) {
      allFieldsLabeled = false;
    }
    expect(hasProperLabel).toBeTruthy();
  }
  
  // All fields should be properly labeled
  expect(allFieldsLabeled).toBeTruthy();
});

// Test: Buttons with icons should have aria-labels
test('buttons with icons should have aria-labels', async ({ page }) => {
  // Visit navbar which should have icon buttons
  await page.goto('/');
  
  // Check all icon-only buttons for accessible names
  const iconButtons = page.locator('button:has(svg):not(:has-text)');
  const count = await iconButtons.count();
  
  for (let i = 0; i < count; i++) {
    const button = iconButtons.nth(i);
    
    // Get button aria-label
    const ariaLabel = await button.getAttribute('aria-label');
    
    // Icon-only buttons must have aria-labels
    expect(ariaLabel).not.toBeNull();
    expect(ariaLabel?.length).toBeGreaterThan(0);
  }
});

// Test: Navigation landmarks should be properly labeled
test('navigation landmarks should be properly labeled', async ({ page }) => {
  await page.goto('/');
  
  // Check that navigation has appropriate ARIA attributes
  const navElements = page.locator('nav[role="navigation"]');
  const count = await navElements.count();
  
  // There should be at least one navigation element
  expect(count).toBeGreaterThan(0);
  
  for (let i = 0; i < count; i++) {
    const nav = navElements.nth(i);
    
    // If there are multiple nav elements, they should have aria-label
    if (count > 1) {
      const ariaLabel = await nav.getAttribute('aria-label');
      expect(ariaLabel).not.toBeNull();
    }
  }
});

// Test: Header should have proper structure
test('header should have proper structure', async ({ page }) => {
  await page.goto('/');
  
  // Check for proper header structure
  const hasProperHeader = await page.evaluate(() => {
    // Look for semantic header or header role
    const headerElement = document.querySelector('header, [role="banner"]');
    if (!headerElement) return false;
    
    // Header should contain a link to the homepage
    const homeLink = headerElement.querySelector('a[href="/"]');
    
    return !!homeLink;
  });
  
  expect(hasProperHeader).toBeTruthy();
}); 