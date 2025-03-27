import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test('should display products page', async ({ page }) => {
    await page.goto('/products');
    
    // Check for products heading
    const heading = await page.getByRole('heading', { name: /products|product list/i }).first();
    await expect(heading).toBeVisible();
    
    // Check for "Create Product" or "Add Product" button
    const createButton = await page.getByRole('button', { name: /create|add product/i });
    await expect(createButton).toBeVisible();
  });

  test('should open create product modal', async ({ page }) => {
    await page.goto('/products');
    
    // Click the create product button
    const createButton = await page.getByRole('button', { name: /create|add product/i });
    await createButton.click();
    
    // Check that the modal appears
    const modalTitle = await page.getByRole('heading', { name: /create|add|new product/i });
    await expect(modalTitle).toBeVisible();
    
    // Check for form elements
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/price/i)).toBeVisible();
  });

  test('should create a new product', async ({ page }) => {
    await page.goto('/products');
    
    // Get initial product count if there's a table or list
    const initialProductsCount = await page.locator('table tbody tr, ul li, div[role="listitem"]').count();
    
    // Click the create product button
    const createButton = await page.getByRole('button', { name: /create|add product/i });
    await createButton.click();
    
    // Fill the product form
    const productName = `Test Product ${Date.now()}`;
    await page.getByLabel(/name/i).fill(productName);
    await page.getByLabel(/price/i).fill('25.99');
    
    // Optionally fill other fields if they exist
    const unitInput = page.getByLabel(/unit|unit of measure/i);
    if (await unitInput.isVisible()) {
      await unitInput.fill('sq ft');
    }
    
    const descriptionInput = page.getByLabel(/description/i);
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('Test product description');
    }
    
    // Submit the form
    await page.getByRole('button', { name: /save|create|add/i }).click();
    
    // Check that the product has been added to the table/list
    await expect(page.getByText(productName)).toBeVisible();
    
    // Verify product count increased if there's a table or list
    const newProductsCount = await page.locator('table tbody tr, ul li, div[role="listitem"]').count();
    expect(newProductsCount).toBeGreaterThan(initialProductsCount);
  });

  test('should edit an existing product', async ({ page }) => {
    await page.goto('/products');
    
    // Find and click edit button on a product (first one in the list)
    const editButtons = await page.getByRole('button', { name: /edit|pencil/i });
    if (await editButtons.count() > 0) {
      await editButtons.first().click();
      
      // Check that edit form appears
      await expect(page.getByRole('heading', { name: /edit product/i })).toBeVisible();
      
      // Update product name
      const updatedName = `Updated Product ${Date.now()}`;
      const nameInput = await page.getByLabel(/name/i);
      await nameInput.clear();
      await nameInput.fill(updatedName);
      
      // Submit the form
      await page.getByRole('button', { name: /save|update/i }).click();
      
      // Verify updated product name appears in the list
      await expect(page.getByText(updatedName)).toBeVisible();
    }
  });

  test('should delete a product', async ({ page }) => {
    await page.goto('/products');
    
    // Get initial product count
    const initialProductsCount = await page.locator('table tbody tr, ul li, div[role="listitem"]').count();
    
    // Find and click delete button on a product
    const deleteButtons = await page.getByRole('button', { name: /delete|trash|remove/i });
    if (await deleteButtons.count() > 0) {
      // Store the product name to verify it's removed
      const productRow = deleteButtons.first().locator('..').locator('..');
      const productName = await productRow.getByRole('cell').first().textContent();
      
      await deleteButtons.first().click();
      
      // Handle confirmation dialog if it appears
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Verify product count decreased
      const newProductsCount = await page.locator('table tbody tr, ul li, div[role="listitem"]').count();
      expect(newProductsCount).toBeLessThan(initialProductsCount);
      
      // Additional check - the specific product shouldn't be visible anymore
      if (productName) {
        await expect(page.getByText(productName)).not.toBeVisible();
      }
    }
  });

  test('should search or filter products', async ({ page }) => {
    await page.goto('/products');
    
    // Look for search input
    const searchInput = await page.getByPlaceholder(/search|filter/i);
    if (await searchInput.isVisible()) {
      // Get initial count of visible products
      const initialCount = await page.locator('table tbody tr, ul li, div[role="listitem"]').count();
      
      // Enter search term
      await searchInput.fill('unique search term');
      
      // If there's a search button, click it
      const searchButton = page.getByRole('button', { name: /search/i });
      if (await searchButton.isVisible()) {
        await searchButton.click();
      }
      
      // Wait for filtered results
      await page.waitForTimeout(500);
      
      // The filtered count may be less than or equal to initial count
      const filteredCount = await page.locator('table tbody tr, ul li, div[role="listitem"]').count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });
}); 