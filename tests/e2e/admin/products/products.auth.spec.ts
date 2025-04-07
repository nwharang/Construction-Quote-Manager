import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * Product Management tests for authenticated users
 * Tests the products list, create, and edit functionality
 * @tags @auth
 */
test.describe('Product Management', () => {
  test.describe('Products List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/products');
      await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
    });

    test('should display products list with expected columns', async ({ page }) => {
      const productsTable = page.getByRole('table');
      await expect(productsTable).toBeVisible();
      
      const expectedColumns = ['Name', 'Category', 'Price', 'SKU', 'Actions'];
      for (const column of expectedColumns) {
        await expect(productsTable.getByRole('columnheader', { name: new RegExp(column, 'i') })).toBeVisible();
      }
    });

    test('should have working search functionality', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
      
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      await expect(page).toHaveURL(/.*search=test.*/);
      
      await searchInput.clear();
      await searchInput.press('Enter');
      
      await expect(page).not.toHaveURL(/.*search=.*/);
    });

    test('should navigate to create new product page', async ({ page }) => {
      await page.getByRole('button', { name: /new product/i }).click();
      
      await expect(page).toHaveURL(/\/admin\/products\/new/);
      await expect(page.getByRole('heading', { name: /new product/i })).toBeVisible();
    });

    test('should support view, edit and delete actions', async ({ page }) => {
      // Wait for product rows to be visible (if any)
      const hasProducts = await page.getByTestId('product-row').first().isVisible();
      
      if (hasProducts) {
        // Test view action
        await page.getByTestId('view-product-action').first().click();
        await expect(page).toHaveURL(/\/admin\/products\/[^/]+\/view/);
        await page.goBack();
        
        // Test edit action
        await page.getByTestId('edit-product-action').first().click();
        await expect(page).toHaveURL(/\/admin\/products\/[^/]+\/edit/);
        await page.goBack();
        
        // Test delete action (just verify it's visible, don't actually delete)
        await expect(page.getByTestId('delete-product-action').first()).toBeVisible();
      } else {
        test.skip(true, 'No products available to test with');
      }
    });
  });

  test.describe('Product Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/products/new');
      await expect(page.getByRole('heading', { name: /new product/i })).toBeVisible();
    });

    test('should display product creation form with all required fields', async ({ page }) => {
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/unit price/i)).toBeVisible();
      await expect(page.getByLabel(/category/i)).toBeVisible();
      await expect(page.getByLabel(/sku/i)).toBeVisible();
      await expect(page.getByLabel(/unit/i)).toBeVisible();
      await expect(page.getByLabel(/description/i)).toBeVisible();
      
      await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    });

    test('should show validation errors on empty submission', async ({ page }) => {
      await page.getByRole('button', { name: /save/i }).click();
      
      await expect(page.getByText(/name is required/i)).toBeVisible();
      await expect(page.getByText(/price is required/i)).toBeVisible();
    });

    test('should successfully create a product with valid data', async ({ page }) => {
      // Generate unique data to avoid conflicts
      const uniqueId = uuidv4().substring(0, 8);
      const productName = `Test Product ${uniqueId}`;
      const productSku = `SKU-${uniqueId}`;
      
      // Fill product form
      await page.getByLabel(/name/i).fill(productName);
      await page.getByLabel(/unit price/i).fill('99.99');
      await page.getByLabel(/category/i).fill('Test Category');
      await page.getByLabel(/sku/i).fill(productSku);
      await page.getByLabel(/unit/i).fill('each');
      await page.getByLabel(/description/i).fill('This is a test product description');
      
      // Submit form
      await page.getByRole('button', { name: /save/i }).click();
      
      // Check for success message
      await expect(page.getByText(/product created successfully/i)).toBeVisible();
      
      // Should redirect to products list
      await expect(page).toHaveURL(/\/admin\/products/);
      
      // The new product should be in the list
      await expect(page.getByText(productName)).toBeVisible();
    });
  });

  test.describe('Product Editing', () => {
    test('should edit an existing product', async ({ page }) => {
      // Go to products list
      await page.goto('/admin/products');
      
      // Check if there are any products
      const hasProducts = await page.getByTestId('product-row').first().isVisible();
      
      if (hasProducts) {
        // Click edit on first product
        await page.getByTestId('edit-product-action').first().click();
        
        // Wait for edit form to load
        await expect(page).toHaveURL(/\/admin\/products\/[^/]+\/edit/);
        await expect(page.getByRole('heading', { name: /edit product/i })).toBeVisible();
        
        // Update some data
        const newPrice = (Math.floor(Math.random() * 9900) / 100 + 10).toFixed(2);
        await page.getByLabel(/unit price/i).clear();
        await page.getByLabel(/unit price/i).fill(newPrice);
        
        // Submit form
        await page.getByRole('button', { name: /save/i }).click();
        
        // Check for success message
        await expect(page.getByText(/product updated successfully/i)).toBeVisible();
        
        // Should redirect to products list
        await expect(page).toHaveURL(/\/admin\/products/);
      } else {
        test.skip(true, 'No products available to test with');
      }
    });
  });
}); 