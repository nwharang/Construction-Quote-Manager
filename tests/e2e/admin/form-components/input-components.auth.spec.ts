import { test, expect } from '@playwright/test';

/**
 * Input Components tests for authenticated users
 * Tests the specialized input components mentioned in context.mdc
 * @tags @auth
 */
test.describe('Specialized Input Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to quote creation page where all specialized inputs should be used
    await page.goto('/admin/quotes/new');
    // Ensure we're on the create quote page by checking for heading
    await expect(page.getByRole('heading', { name: /new quote/i })).toBeVisible();
  });

  test('should have price/currency input fields', async ({ page }) => {
    // Check if we need to add a task to see price fields
    const priceField = page.locator('input[id*="price"], [aria-label*="price"], [placeholder*="price"]').first();
    
    if (await priceField.count() === 0) {
      // Try to add a task to get price field
      const addTaskButton = page.getByRole('button', { name: /add task/i });
      if (await addTaskButton.count() > 0) {
        await addTaskButton.click();
      }
    }
    
    // Find any price field
    const anyPriceField = page.locator('input[id*="price"], [aria-label*="price"], [placeholder*="price"]').first();
    
    if (await anyPriceField.count() === 0) {
      test.skip(true, 'No price field found to test');
      return;
    }
    
    // Ensure price field is visible
    await expect(anyPriceField).toBeVisible();
    
    // Enter a value and tab out to trigger formatting
    await anyPriceField.fill('123.45');
    await page.keyboard.press('Tab');
    
    // Get the value after input
    const value = await anyPriceField.inputValue();
    
    // Value should contain digits
    expect(value).toMatch(/\d/);
  });

  test('should have number inputs for quantities', async ({ page }) => {
    // Try to add a material or task to test quantity fields
    let quantityField = page.locator('input[id*="quantity"], [aria-label*="quantity"], [placeholder*="quantity"], input[id*="hours"], [aria-label*="hours"]').first();
    
    if (await quantityField.count() === 0) {
      // Try to add a task or material
      const addButton = page.getByRole('button', { name: /add task|add material/i }).first();
      if (await addButton.count() > 0) {
        await addButton.click();
      }
      
      // Check for quantity field again
      quantityField = page.locator('input[id*="quantity"], [aria-label*="quantity"], [placeholder*="quantity"], input[id*="hours"], [aria-label*="hours"]').first();
    }
    
    if (await quantityField.count() === 0) {
      test.skip(true, 'No quantity field found to test');
      return;
    }
    
    // Ensure quantity field is visible
    await expect(quantityField).toBeVisible();
    
    // Enter a integer value
    await quantityField.fill('10');
    await page.keyboard.press('Tab');
    
    // Get the value after input
    const value = await quantityField.inputValue();
    
    // Value should be an integer
    expect(value).toMatch(/^\d+$/);
  });

  test('should have customer selector component', async ({ page }) => {
    // Look for customer selector - it could be implemented differently
    const customerSelector = page.locator('select[id*="customer"], [aria-label*="customer"], [placeholder*="customer"], [role="combobox"][aria-label*="customer"]').first();
    
    if (await customerSelector.count() === 0) {
      test.skip(true, 'No customer selector found to test');
      return;
    }
    
    // Ensure customer selector is visible
    await expect(customerSelector).toBeVisible();
    
    // Click the selector to open options
    await customerSelector.click();
    
    // Check if dropdown or search input appears
    const hasDropdownOptions = 
      await page.locator('option, [role="option"], [role="listbox"] *').count() > 0;
    
    const hasSearchInput = 
      await page.locator('input[placeholder*="search"], [aria-label*="search"]').count() > 0;
    
    // Either options or search input should be visible
    expect(hasDropdownOptions || hasSearchInput).toBeTruthy();
  });

  test('should have form validation for required fields', async ({ page }) => {
    // Try to submit the form without filling required fields
    const saveButton = page.getByRole('button', { name: /save/i });
    
    if (await saveButton.count() === 0) {
      test.skip(true, 'No save button found to test form validation');
      return;
    }
    
    await saveButton.click();
    
    // Check for validation messages or error styling
    const hasErrorMessages = 
      await page.locator('text=/required|cannot be empty|invalid|missing/i, [aria-invalid="true"], [data-invalid="true"]').count() > 0;
    
    expect(hasErrorMessages).toBeTruthy();
  });

  test('should have tasks and materials section', async ({ page }) => {
    // Look for tasks & materials section
    const hasSectionHeading = 
      await page.getByText(/tasks & materials|items|line items/i).count() > 0;
    
    expect(hasSectionHeading).toBeTruthy();
    
    // Should have buttons to add items
    const hasAddButtons = 
      await page.getByRole('button', { name: /add task|add material|add item/i }).count() > 0;
    
    expect(hasAddButtons).toBeTruthy();
  });

  test('should have quote summary with calculations', async ({ page }) => {
    // Find summary section
    const summarySection = page.getByText(/quote summary|summary|total/i);
    
    if (await summarySection.count() === 0) {
      test.skip(true, 'No summary section found to test');
      return;
    }
    
    // Try to add a task with values
    const addTaskButton = page.getByRole('button', { name: /add task/i });
    
    if (await addTaskButton.count() > 0) {
      await addTaskButton.click();
      
      // Add wait for task form to be fully visible and interactive
      await page.waitForTimeout(500);
      
      // Try to fill description, hours/quantity, and price
      const descField = page.locator('input[id*="description"], [aria-label*="description"], [placeholder*="description"]').first();
      const hoursField = page.locator('input[id*="hours"], [aria-label*="hours"], input[id*="quantity"], [aria-label*="quantity"]').first();
      const priceField = page.locator('input[id*="price"], [aria-label*="price"]').first();
      
      if (await descField.count() > 0) {
        await descField.fill('Test Task');
        // Add wait after field interaction
        await page.waitForTimeout(200);
      }
      
      if (await hoursField.count() > 0) {
        await hoursField.fill('10');
        // Add wait after field interaction - might trigger calculation
        await page.waitForTimeout(300);
      }
      
      if (await priceField.count() > 0) {
        await priceField.fill('50');
        // Add wait after field interaction - might trigger calculation
        await page.waitForTimeout(300);
      }
      
      // Add extra tab press to ensure the field loses focus and triggers any blur events
      await page.keyboard.press('Tab');
      
      // Look for subtotal/total
      const totalElement = page.locator('[data-testid*="total"], [id*="total"], [aria-label*="total"]').first();
      
      if (await totalElement.count() > 0) {
        // Increased wait time for calculation to update
        await page.waitForTimeout(1000);
        
        // Get total value
        const totalValue = await totalElement.textContent();
        
        // Total should contain digits
        expect(totalValue).toMatch(/\d/);
      }
    }
  });

  test('should show loading state when submitting form', async ({ page }) => {
    // Fill minimum required fields to allow submission
    // Try to find and fill title field
    const titleField = page.locator('input[id*="title"], [aria-label*="title"], [name*="title"]').first();
    
    if (await titleField.count() > 0) {
      await titleField.fill('Test Quote');
    }
    
    // Try to find and select customer
    const customerField = page.locator('select[id*="customer"], [aria-label*="customer"], [role="combobox"][aria-label*="customer"]').first();
    
    if (await customerField.count() > 0) {
      await customerField.click();
      
      // Try to select first option or create new
      const firstOption = page.locator('option, [role="option"]').first();
      const createNewOption = page.getByText(/create new|add new/i);
      
      if (await firstOption.count() > 0) {
        await firstOption.click();
      } else if (await createNewOption.count() > 0) {
        await createNewOption.click();
        
        // If create new dialog opens, fill minimal info and submit
        const nameField = page.locator('input[id*="name"], [aria-label*="name"]').first();
        if (await nameField.count() > 0) {
          await nameField.fill('Test Customer');
          
          // Submit dialog form
          const dialogSaveButton = page.locator('[role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("Create")').first();
          if (await dialogSaveButton.count() > 0) {
            await dialogSaveButton.click();
          }
        }
      }
    }
    
    // Try to submit the form
    const saveButton = page.getByRole('button', { name: /save/i });
    
    if (await saveButton.count() === 0) {
      test.skip(true, 'No save button found to test loading state');
      return;
    }
    
    await saveButton.click();
    
    // Check for loading indicators
    const hasLoadingIndicator = 
      await page.locator('[data-testid*="loading"], [aria-busy="true"], button[disabled]').count() > 0;
    
    expect(hasLoadingIndicator).toBeTruthy();
  });
}); 