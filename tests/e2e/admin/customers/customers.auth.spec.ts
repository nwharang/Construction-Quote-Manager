import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * Customer Management tests for authenticated users
 * Tests the customers list, create, and edit functionality
 * @tags @auth
 */
test.describe('Customer Management', () => {
  test.describe('Customers List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/customers');
      await expect(page.getByRole('heading', { name: /customers/i })).toBeVisible();
    });

    test('should display customers list with expected columns', async ({ page }) => {
      const customersTable = page.getByRole('table');
      await expect(customersTable).toBeVisible();
      
      const expectedColumns = ['Name', 'Email', 'Phone', 'Created', 'Actions'];
      for (const column of expectedColumns) {
        await expect(customersTable.getByRole('columnheader', { name: new RegExp(column, 'i') })).toBeVisible();
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

    test('should navigate to create new customer page', async ({ page }) => {
      await page.getByRole('button', { name: /new customer/i }).click();
      
      await expect(page).toHaveURL(/\/admin\/customers\/new/);
      await expect(page.getByRole('heading', { name: /new customer/i })).toBeVisible();
    });

    test('should support view, edit and delete actions', async ({ page }) => {
      // Wait for customer rows to be visible (if any)
      const hasCustomers = await page.getByTestId('customer-row').first().isVisible();
      
      if (hasCustomers) {
        // Test view action
        await page.getByTestId('view-customer-action').first().click();
        await expect(page).toHaveURL(/\/admin\/customers\/[^/]+\/view/);
        await page.goBack();
        
        // Test edit action
        await page.getByTestId('edit-customer-action').first().click();
        await expect(page).toHaveURL(/\/admin\/customers\/[^/]+\/edit/);
        await page.goBack();
        
        // Test delete action (just verify it's visible, don't actually delete)
        await expect(page.getByTestId('delete-customer-action').first()).toBeVisible();
      } else {
        test.skip(true, 'No customers available to test with');
      }
    });
  });

  test.describe('Customer Creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/customers/new');
      await expect(page.getByRole('heading', { name: /new customer/i })).toBeVisible();
    });

    test('should display customer creation form with all required fields', async ({ page }) => {
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/phone/i)).toBeVisible();
      await expect(page.getByLabel(/address/i)).toBeVisible();
      
      await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    });

    test('should show validation errors on empty submission', async ({ page }) => {
      await page.getByRole('button', { name: /save/i }).click();
      
      await expect(page.getByText(/name is required/i)).toBeVisible();
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('should successfully create a customer with valid data', async ({ page }) => {
      // Generate unique data to avoid conflicts
      const uniqueId = uuidv4().substring(0, 8);
      const customerName = `Test Customer ${uniqueId}`;
      const customerEmail = `test.${uniqueId}@example.com`;
      
      // Fill customer form
      await page.getByLabel(/name/i).fill(customerName);
      await page.getByLabel(/email/i).fill(customerEmail);
      await page.getByLabel(/phone/i).fill('555-123-4567');
      await page.getByLabel(/address/i).fill('123 Test Street, Test City');
      
      // Submit form
      await page.getByRole('button', { name: /save/i }).click();
      
      // Check for success message
      await expect(page.getByText(/customer created successfully/i)).toBeVisible();
      
      // Should redirect to customers list
      await expect(page).toHaveURL(/\/admin\/customers/);
      
      // The new customer should be in the list
      await expect(page.getByText(customerName)).toBeVisible();
    });
  });

  test.describe('Customer Editing', () => {
    test('should edit an existing customer', async ({ page }) => {
      // Go to customers list
      await page.goto('/admin/customers');
      
      // Check if there are any customers
      const hasCustomers = await page.getByTestId('customer-row').first().isVisible();
      
      if (hasCustomers) {
        // Click edit on first customer
        await page.getByTestId('edit-customer-action').first().click();
        
        // Wait for edit form to load
        await expect(page).toHaveURL(/\/admin\/customers\/[^/]+\/edit/);
        await expect(page.getByRole('heading', { name: /edit customer/i })).toBeVisible();
        
        // Update some data
        const newPhone = `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
        await page.getByLabel(/phone/i).clear();
        await page.getByLabel(/phone/i).fill(newPhone);
        
        // Submit form
        await page.getByRole('button', { name: /save/i }).click();
        
        // Check for success message
        await expect(page.getByText(/customer updated successfully/i)).toBeVisible();
        
        // Should redirect to customers list
        await expect(page).toHaveURL(/\/admin\/customers/);
      } else {
        test.skip(true, 'No customers available to test with');
      }
    });
  });
}); 