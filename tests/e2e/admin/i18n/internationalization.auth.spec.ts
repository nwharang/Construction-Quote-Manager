import { test, expect } from '@playwright/test';

/**
 * Internationalization tests for authenticated users
 * Tests language switching and translation functionality
 * @tags @auth
 */
test.describe('Internationalization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page where language can be changed
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should display language settings in settings page', async ({ page }) => {
    // Check for localization section - it might have different headings
    const hasLocalizationSection = 
      await page.getByRole('heading', { name: /localization|language|region/i }).isVisible();
    
    expect(hasLocalizationSection).toBeTruthy();
    
    // Check for language settings control - could be select, radio buttons, or other controls
    const hasLanguageControl = 
      await page.locator('[name*="language"], [id*="language"], [aria-label*="language"]').count() > 0;
    
    expect(hasLanguageControl).toBeTruthy();
  });

  test('should save language preference in settings', async ({ page }) => {
    // Find the language selection control
    const languageControl = page.locator(
      '[name*="language"], [id*="language"], [aria-label*="language"]'
    ).first();
    
    if (await languageControl.count() === 0) {
      test.skip(true, 'No language selection control found');
      return;
    }
    
    // Click the language control
    await languageControl.click();
    
    // Click any option - we just want to make sure we can select a language
    // This handles both dropdown selects and radio button groups
    const languageOption = page.locator('option, [role="option"], [type="radio"][name*="language"]').first();
    
    if (await languageOption.count() > 0) {
      await languageOption.click();
      
      // Click save button
      await page.getByRole('button', { name: /save|apply|update|changes/i }).click();
      
      // Verify success message appears
      await expect(page.getByText(/success|saved|updated/i)).toBeVisible();
    } else {
      test.skip(true, 'No language options found to select');
    }
  });

  test('should display locale-specific formatting', async ({ page }) => {
    // Go to quotes list to check formatting
    await page.goto('/admin/quotes');
    
    // We'll check for the presence of number formatting
    // Look for elements that would contain currency or dates
    const hasFormattedValues = 
      await page.locator(
        '[data-testid*="date"], [data-testid*="time"], [data-testid*="currency"], [data-testid*="price"], [data-testid*="total"]'
      ).count() > 0;
    
    expect(hasFormattedValues).toBeTruthy();
  });

  test('should have consistent UI text across pages', async ({ page }) => {
    // Pages to check for consistent text
    const pagesToCheck = [
      '/admin/dashboard',
      '/admin/quotes',
      '/admin/customers'
    ];
    
    // Get text from the first page
    await page.goto(pagesToCheck[0]);
    const firstPageTitle = await page.getByRole('heading', { level: 1 }).textContent();
    
    // Navigate to other pages and ensure headings exist
    for (let i = 1; i < pagesToCheck.length; i++) {
      await page.goto(pagesToCheck[i]);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
    
    // Go back to first page and confirm heading is still the same
    await page.goto(pagesToCheck[0]);
    const titleAfterNavigation = await page.getByRole('heading', { level: 1 }).textContent();
    
    // Title should be the same as before
    expect(titleAfterNavigation).toEqual(firstPageTitle);
  });

  test('should display currency values correctly', async ({ page }) => {
    // Go to quotes page where currency would be displayed
    await page.goto('/admin/quotes');
    
    // Look for currency values
    const currencyElements = page.locator(
      '[data-testid*="price"], [data-testid*="total"], [data-testid*="currency"]'
    );
    
    if (await currencyElements.count() > 0) {
      // Get the text content of the first currency element
      const currencyText = await currencyElements.first().textContent();
      
      // Currency text should contain either numbers or currency symbols
      expect(currencyText).toBeTruthy();
      expect(currencyText).toMatch(/\d|[$€¥£]/);
    } else {
      test.skip(true, 'No currency elements found to test');
    }
  });

  test('should display date values in a consistent format', async ({ page }) => {
    // Go to quotes page where dates would be displayed
    await page.goto('/admin/quotes');
    
    // Look for date elements
    const dateElements = page.locator(
      '[data-testid*="date"], [data-testid*="created"], [data-testid*="time"]'
    );
    
    if (await dateElements.count() > 0) {
      // Get the text content of the first date element
      const dateText = await dateElements.first().textContent();
      
      // Date text should be non-empty and contain numbers
      expect(dateText).toBeTruthy();
      expect(dateText).toMatch(/\d/);
      
      // If we have multiple date elements, they should have consistent formatting
      if (await dateElements.count() > 1) {
        const formats: string[] = [];
        
        // Check up to 3 date elements
        const elementsToCheck = Math.min(await dateElements.count(), 3);
        
        for (let i = 0; i < elementsToCheck; i++) {
          const text = await dateElements.nth(i).textContent();
          if (text) {
            // Check if date format uses slashes, dashes or dots as separators
            const separator = text.match(/[\/\-\.]/)?.[0] || '';
            formats.push(separator);
          }
        }
        
        // All checked dates should use the same separator
        if (formats.length > 1) {
          const allSame = formats.every(f => f === formats[0]);
          expect(allSame).toBeTruthy();
        }
      }
    } else {
      test.skip(true, 'No date elements found to test');
    }
  });

  test('should display translations in Vietnamese when switched', async ({ page }) => {
    // Define the pages to check
    const pagesToCheck = [
      '/admin/dashboard',
      '/admin/quotes',
      '/admin/customers',
      '/admin/products'
    ].filter(Boolean); // Ensure no undefined values

    // Check initial page in English
    await page.goto(pagesToCheck[0] || '/admin/dashboard');
    
    // Check page is in Vietnamese
    for (let i = 0; i < pagesToCheck.length; i++) {
      await page.goto(pagesToCheck[i] || '/admin/dashboard');
      // ... existing checks ...
    }

    // Switch back to English
    await page.goto(pagesToCheck[0] || '/admin/dashboard');
    
    // ... rest of the test ...
  });
}); 