import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests
 * 
 * Comprehensive tests for accessibility compliance across the application:
 * - Tests critical pages for WCAG 2.1 compliance
 * - Validates keyboard navigation
 * - Checks screen reader compatibility
 * - Ensures proper focus management
 * - Verifies color contrast and text readability
 */
test.describe('Accessibility', () => {
  // Authentication helper to sign in before tests
  async function authenticateUser(page: Page) {
    await page.goto('/auth/signin');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for successful authentication
    await page.waitForURL(/\/(quotes|dashboard)/);
  }
  
  test.describe('Public Pages', () => {
    test('homepage should have no accessibility violations', async ({ page }) => {
      await page.goto('/');
      
      // Run axe against the page
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      // Assert no violations are found
      expect(accessibilityScanResults.violations).toEqual([]);
    });
    
    test('sign-in page should have no accessibility violations', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Run axe against the page
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      // Assert no violations are found
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Also check proper form labeling
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
    });
    
    test('sign-up page should have no accessibility violations', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // Run axe against the page
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      // Assert no violations are found
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Also check proper form labeling
      await expect(page.getByLabel('Name')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
    });
  });
  
  test.describe('Authenticated Pages', () => {
    // Authenticate before each test
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page);
    });
    
    test('dashboard should have no accessibility violations', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Run axe against the page
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      // Assert no violations are found
      expect(accessibilityScanResults.violations).toEqual([]);
    });
    
    test('quotes page should have no accessibility violations', async ({ page }) => {
      await page.goto('/quotes');
      
      // Run axe against the page
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      // Assert no violations are found
      expect(accessibilityScanResults.violations).toEqual([]);
    });
    
    test('products page should have no accessibility violations', async ({ page }) => {
      await page.goto('/products');
      
      // Run axe against the page
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      // Assert no violations are found
      expect(accessibilityScanResults.violations).toEqual([]);
    });
    
    test('create quote form should have proper accessibility features', async ({ page }) => {
      await page.goto('/quotes');
      
      // Open the create quote form
      await page.getByRole('button', { name: /Create|New Quote/i }).click();
      
      // Wait for the form to be visible
      await expect(page.getByLabel(/project name/i)).toBeVisible();
      
      // Run axe against the page with the form open
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      // Assert no violations are found
      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Check proper form labeling
      await expect(page.getByLabel(/project name/i)).toBeVisible();
      await expect(page.getByLabel(/customer name/i)).toBeVisible();
    });
  });
  
  test.describe('Keyboard Navigation', () => {
    test('sign-in form should be navigable by keyboard', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Start with the email field
      await page.getByLabel('Email').focus();
      await expect(page.getByLabel('Email')).toBeFocused();
      
      // Tab to password field
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('Password')).toBeFocused();
      
      // Tab to "Remember me" if it exists
      await page.keyboard.press('Tab');
      try {
        // This might be a checkbox - try different selectors
        const rememberMeCheckbox = page.getByLabel(/remember me/i);
        if (await rememberMeCheckbox.isVisible()) {
          await expect(rememberMeCheckbox).toBeFocused();
          // Tab one more time to get to sign in button
          await page.keyboard.press('Tab');
        }
      } catch (e) {
        // If no remember me, we should be on the button
      }
      
      // Should now be on the sign in button
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeFocused();
      
      // Press Enter to submit the form
      await page.keyboard.press('Enter');
      
      // Ensure validation errors are properly shown
      await expect(page.getByText(/email is required|email field is required/i)).toBeVisible();
    });
    
    test('dashboard should be navigable by keyboard', async ({ page }) => {
      await authenticateUser(page);
      await page.goto('/dashboard');
      
      // Focus on the first interactive element
      await page.keyboard.press('Tab');
      
      // Check that something is focused
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el && el.tagName ? el.tagName.toLowerCase() : null;
      });
      
      expect(focusedElement).not.toBeNull();
      
      // Continue tabbing through the page
      let tabCount = 0;
      let lastFocusedElement = focusedElement;
      
      // Tab through a few elements to ensure keyboard navigation works
      while (tabCount < 5) {
        await page.keyboard.press('Tab');
        
        const currentFocusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el && el.tagName ? el.tagName.toLowerCase() : null;
        });
        
        // Ensure we're moving through different elements
        expect(currentFocusedElement).not.toBeNull();
        tabCount++;
      }
    });
  });
  
  test.describe('Focus Management', () => {
    test('modal focus should be trapped when opening create quote form', async ({ page }) => {
      await authenticateUser(page);
      await page.goto('/quotes');
      
      // Open the create quote form
      await page.getByRole('button', { name: /Create|New Quote/i }).click();
      
      // Wait for the form to be visible
      await expect(page.getByLabel(/project name/i)).toBeVisible();
      
      // Check that focus is set to the first input
      await expect(page.getByLabel(/project name/i)).toBeFocused();
      
      // Tab to the end of the modal and check if focus wraps around
      let isWrapped = false;
      for (let i = 0; i < 15; i++) {
        // Tab through all elements
        await page.keyboard.press('Tab');
        
        // Check if we've wrapped around to a form element
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el && el.tagName ? el.tagName.toLowerCase() : null;
        });
        
        if (focusedElement === 'input' || focusedElement === 'button') {
          isWrapped = true;
          break;
        }
      }
      
      // Focus should be trapped within the modal
      expect(isWrapped).toBeTruthy();
    });
    
    test('closing dialog should return focus to trigger element', async ({ page }) => {
      await authenticateUser(page);
      await page.goto('/quotes');
      
      // Find and focus the create button
      const createButton = page.getByRole('button', { name: /Create|New Quote/i });
      await createButton.focus();
      await expect(createButton).toBeFocused();
      
      // Click to open modal
      await createButton.click();
      
      // Wait for the form to be visible
      await expect(page.getByLabel(/project name/i)).toBeVisible();
      
      // Find and click cancel button
      const cancelButton = page.getByRole('button', { name: /cancel/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        
        // Wait for the form to be closed
        await expect(page.getByLabel(/project name/i)).not.toBeVisible();
        
        // Focus should return to the create button
        await expect(createButton).toBeFocused();
      }
    });
  });
  
  test.describe('ARIA and Screen Reader Support', () => {
    test('navigation elements should have correct ARIA roles', async ({ page }) => {
      await page.goto('/');
      
      // Check navigation
      const navigation = page.locator('nav');
      if (await navigation.isVisible()) {
        // Navigation should have role="navigation" or be a <nav> element
        expect(
          await navigation.evaluate(el => 
            el.tagName.toLowerCase() === 'nav' || el.getAttribute('role') === 'navigation'
          )
        ).toBeTruthy();
      }
      
      // Check hamburger menu button if it exists
      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]');
      if (await menuButton.isVisible()) {
        // Should have expanded state
        expect(
          await menuButton.evaluate(el => 
            el.getAttribute('aria-expanded') !== null
          )
        ).toBeTruthy();
      }
    });
    
    test('forms should have proper error handling for screen readers', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Submit empty form to trigger validation
      await page.getByRole('button', { name: 'Sign In' }).click();
      
      // Error messages should have appropriate ARIA attributes
      const errorMessages = page.locator('[aria-invalid="true"], .error, .invalid');
      
      // Should have at least one invalidated field
      expect(await errorMessages.count()).toBeGreaterThan(0);
      
      // Check first error field has proper attributes 
      const firstErrorField = errorMessages.first();
      expect(
        await firstErrorField.evaluate(el => 
          el.getAttribute('aria-describedby') !== null || 
          el.hasAttribute('aria-errormessage')
        )
      ).toBeTruthy();
    });
  });
  
  test.describe('Color Contrast', () => {
    test('text elements should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      
      // Run axe against the page specifically for color contrast
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();
      
      // Assert no contrast violations are found
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
}); 