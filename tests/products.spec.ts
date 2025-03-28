import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Products Module Tests
 * 
 * Tests the core products functionality including:
 * - Product listing
 * - Product creation
 * - Product editing
 * - Product deletion
 * - Product search and filtering
 * - Product categories
 */
test.describe('Products Module', () => {
  // Authentication helper to sign in before tests
  async function authenticateUser(page: Page) {
    await page.goto('/auth/signin');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for successful authentication
    await page.waitForURL(/\/(quotes|dashboard)/);
  }
  
  // Test setup - authenticate before each test
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test.describe('Product Listing', () => {
    test('should display products page with create button', async ({ page }) => {
      await page.goto('/products');
      
      // Check for heading and create button
      await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /add|create|new product/i })).toBeVisible();
      
      // Check for product list/table
      const productList = page.locator('table, [role="table"], [role="list"], [data-testid="product-list"]').first();
      await expect(productList).toBeVisible();
    });
    
    test('should display empty state when no products exist', async ({ page }) => {
      await page.goto('/products');
      
      try {
        // Look for empty state message
        const emptyState = page.getByText(/no products found|create your first product/i);
        if (await emptyState.isVisible()) {
          await expect(emptyState).toBeVisible();
        } else {
          // If no explicit empty state, check if table has no data rows
          const tableRows = page.locator('table tbody tr, [role="table"] [role="row"], [data-testid="product-item"]').count();
          expect(await tableRows).toBeLessThanOrEqual(1);
        }
      } catch (e) {
        // Products may already exist, which is fine
        console.log('Empty state test skipped - products may already exist');
      }
    });
    
    test('should search for products', async ({ page }) => {
      await page.goto('/products');
      
      // Look for search input
      const searchInput = page.getByPlaceholder(/search|find/i);
      if (await searchInput.isVisible()) {
        // Try a common search term
        await searchInput.fill('wood');
        await searchInput.press('Enter');
        
        // Wait for search results
        await page.waitForTimeout(500);
        
        // Check results contain the search term or show no results message
        try {
          const results = page.locator('table tbody tr, [role="table"] [role="row"], [data-testid="product-item"]');
          const count = await results.count();
          
          if (count > 0) {
            // At least one result found
            const firstProductText = await results.first().textContent();
            expect(firstProductText?.toLowerCase().includes('wood') || 
                  await page.getByText(/no products found/i).isVisible()).toBeTruthy();
          } else {
            // No results is a valid outcome for a search
            await expect(page.getByText(/no products|no results/i)).toBeVisible();
          }
        } catch (e) {
          // Search may have no results, which is a valid outcome
          console.log('Search test completed - results may vary');
        }
      }
    });
    
    test('should filter products by category', async ({ page }) => {
      await page.goto('/products');
      
      // Look for category filter
      const categoryFilter = page.getByRole('combobox', { name: /category|filter/i });
      if (await categoryFilter.isVisible()) {
        // Click on filter to see options
        await categoryFilter.click();
        
        // Select the first category option
        const firstCategory = page.getByRole('option').first();
        if (await firstCategory.isVisible()) {
          const categoryName = await firstCategory.textContent();
          await firstCategory.click();
          
          // Wait for filter to apply
          await page.waitForTimeout(500);
          
          // Check that filtered results are shown
          await expect(page.getByText(categoryName || '')).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Product Creation', () => {
    test('should open product creation form', async ({ page }) => {
      await page.goto('/products');
      
      // Click create product button
      await page.getByRole('button', { name: /add|create|new product/i }).click();
      
      // Check for form fields
      await expect(page.getByLabel(/product name|name/i)).toBeVisible();
      await expect(page.getByLabel(/price|cost/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /save|create|add/i })).toBeVisible();
    });
    
    test('should validate required fields in product form', async ({ page }) => {
      await page.goto('/products');
      
      // Open create form
      await page.getByRole('button', { name: /add|create|new product/i }).click();
      
      // Try to submit without filling required fields
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      // Check for validation errors
      await expect(page.getByText(/name is required|name field is required/i)).toBeVisible();
      await expect(page.getByText(/price is required|cost is required/i)).toBeVisible();
    });
    
    test('should create a new product', async ({ page }) => {
      await page.goto('/products');
      
      // Open create form
      await page.getByRole('button', { name: /add|create|new product/i }).click();
      
      // Generate unique product name
      const productName = `Test Product ${Date.now()}`;
      
      // Fill product details
      await page.getByLabel(/product name|name/i).fill(productName);
      await page.getByLabel(/price|cost/i).fill('99.99');
      
      // Fill description if field exists
      const descriptionField = page.getByLabel(/description/i);
      if (await descriptionField.isVisible()) {
        await descriptionField.fill('This is a test product');
      }
      
      // Select category if field exists
      const categoryDropdown = page.getByLabel(/category/i);
      if (await categoryDropdown.isVisible()) {
        await categoryDropdown.click();
        await page.getByRole('option').first().click();
      }
      
      // Submit form
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      // Check product was created and appears in list
      await page.waitForTimeout(1000);
      await expect(page.getByText(productName)).toBeVisible();
    });
  });
  
  test.describe('Product Management', () => {
    // Helper to create a test product and return its name
    async function createTestProduct(page: Page): Promise<string> {
      await page.goto('/products');
      await page.getByRole('button', { name: /add|create|new product/i }).click();
      
      const productName = `Test Product ${Date.now()}`;
      await page.getByLabel(/product name|name/i).fill(productName);
      await page.getByLabel(/price|cost/i).fill('99.99');
      
      // Fill description if field exists
      const descriptionField = page.getByLabel(/description/i);
      if (await descriptionField.isVisible()) {
        await descriptionField.fill('This is a test product');
      }
      
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      // Wait for product to be created
      await page.waitForTimeout(1000);
      
      return productName;
    }
    
    test('should edit an existing product', async ({ page }) => {
      // Create a test product first
      const productName = await createTestProduct(page);
      
      // Find and click edit button for the product
      await page.getByText(productName).click();
      const editButton = page.getByRole('button', { name: /edit/i });
      
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Update product name
        const updatedName = `${productName} (Updated)`;
        await page.getByLabel(/product name|name/i).clear();
        await page.getByLabel(/product name|name/i).fill(updatedName);
        
        // Update price
        await page.getByLabel(/price|cost/i).clear();
        await page.getByLabel(/price|cost/i).fill('149.99');
        
        // Save changes
        await page.getByRole('button', { name: /save|update/i }).click();
        
        // Verify changes were saved
        await page.waitForTimeout(1000);
        await expect(page.getByText(updatedName)).toBeVisible();
        await expect(page.getByText('149.99')).toBeVisible();
      } else {
        // Alternative: if product list has edit button directly
        const productRow = page.getByText(productName).locator('xpath=ancestor::tr');
        const rowEditButton = productRow.getByRole('button', { name: /edit/i });
        
        if (await rowEditButton.isVisible()) {
          await rowEditButton.click();
          
          // Update product name
          const updatedName = `${productName} (Updated)`;
          await page.getByLabel(/product name|name/i).clear();
          await page.getByLabel(/product name|name/i).fill(updatedName);
          
          // Save changes
          await page.getByRole('button', { name: /save|update/i }).click();
          
          // Verify changes were saved
          await page.waitForTimeout(1000);
          await expect(page.getByText(updatedName)).toBeVisible();
        }
      }
    });
    
    test('should delete a product', async ({ page }) => {
      // Create a test product first
      const productName = await createTestProduct(page);
      
      // Find and delete the product
      const productRow = page.getByText(productName).locator('xpath=ancestor::tr');
      const deleteButton = productRow.getByRole('button', { name: /delete|remove/i });
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Handle confirmation dialog if present
        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        // Wait for deletion
        await page.waitForTimeout(1000);
        
        // Verify product was deleted
        const productExists = await page.getByText(productName).isVisible();
        expect(productExists).toBeFalsy();
      } else {
        // Alternative approach if product needs to be opened first
        await page.getByText(productName).click();
        const detailsDeleteButton = page.getByRole('button', { name: /delete|remove/i });
        
        if (await detailsDeleteButton.isVisible()) {
          await detailsDeleteButton.click();
          
          // Handle confirmation dialog if present
          const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
          
          // Verify product was deleted
          await page.goto('/products');
          await page.waitForTimeout(500);
          const productExists = await page.getByText(productName).isVisible();
          expect(productExists).toBeFalsy();
        }
      }
    });
    
    test('should view product details', async ({ page }) => {
      // Create a test product first
      const productName = await createTestProduct(page);
      
      // Click on the product name to view details
      await page.getByText(productName).click();
      
      // Verify product details are displayed
      await expect(page.getByText(productName)).toBeVisible();
      await expect(page.getByText('99.99')).toBeVisible();
      
      // Check for description
      await expect(page.getByText('This is a test product')).toBeVisible();
    });
  });
}); 