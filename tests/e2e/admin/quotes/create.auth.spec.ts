import { test, expect } from '@playwright/test';

/**
 * Quote Creation tests for authenticated users
 * Tests the entire flow of creating a new quote
 * @tags @auth
 */
test.describe('Quote Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to create quote page
    await page.goto('/admin/quotes/new');
    
    // Ensure we're on the create quote page
    await expect(page.getByRole('heading', { name: /new quote/i })).toBeVisible();
  });

  test('should display quote creation form with all required fields', async ({ page }) => {
    // Check for mandatory fields
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/customer/i)).toBeVisible();
    
    // Check for the task and materials sections
    await expect(page.getByText(/tasks & materials/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add task/i })).toBeVisible();
    
    // Check for quote summary section
    await expect(page.getByText(/quote summary/i)).toBeVisible();
    
    // Check for form actions
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('should show validation errors on empty submission', async ({ page }) => {
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /save/i }).click();
    
    // Check for validation errors
    await expect(page.getByText(/title is required/i)).toBeVisible();
    await expect(page.getByText(/customer is required/i)).toBeVisible();
  });

  test('should allow selecting a customer', async ({ page }) => {
    // Click on customer dropdown
    await page.getByLabel(/customer/i).click();
    
    // Wait for dropdown options to appear
    await page.getByRole('option').first().waitFor();
    
    // Select the first customer
    await page.getByRole('option').first().click();
    
    // Verify a customer is selected
    await expect(page.getByLabel(/customer/i)).not.toHaveValue('');
  });

  test('should allow adding a task', async ({ page }) => {
    // Click add task button
    await page.getByRole('button', { name: /add task/i }).click();
    
    // Task form should appear
    await expect(page.getByLabel(/task description/i)).toBeVisible();
    await expect(page.getByLabel(/task price/i)).toBeVisible();
    
    // Fill task details
    await page.getByLabel(/task description/i).fill('Test Task');
    await page.getByLabel(/task price/i).fill('100');
    
    // Verify task is added
    await expect(page.getByText('Test Task')).toBeVisible();
    
    // Verify quote summary is updated
    await expect(page.getByText(/tasks subtotal/i)).toContainText('100');
  });

  test('should allow adding materials to a task', async ({ page }) => {
    // First add a task
    await page.getByRole('button', { name: /add task/i }).click();
    await page.getByLabel(/task description/i).fill('Test Task with Materials');
    await page.getByLabel(/task price/i).fill('100');
    
    // Find and click "Add Material" button
    await page.getByRole('button', { name: /add material/i }).click();
    
    // Material form fields should appear
    await expect(page.getByLabel(/product\/material/i)).toBeVisible();
    await expect(page.getByLabel(/quantity/i)).toBeVisible();
    await expect(page.getByLabel(/unit price/i)).toBeVisible();
    
    // Fill material details
    await page.getByLabel(/product\/material/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/quantity/i).fill('2');
    await page.getByLabel(/unit price/i).fill('50');
    
    // Verify materials subtotal is updated
    await expect(page.getByText(/materials subtotal/i)).toContainText('100'); // 2 * 50
  });

  test('should calculate totals correctly', async ({ page }) => {
    // Add a task
    await page.getByRole('button', { name: /add task/i }).click();
    await page.getByLabel(/task description/i).fill('Test Task');
    await page.getByLabel(/task price/i).fill('100');
    
    // Add material 
    await page.getByRole('button', { name: /add material/i }).click();
    await page.getByLabel(/product\/material/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/quantity/i).fill('2');
    await page.getByLabel(/unit price/i).fill('50');
    
    // Get subtotals and grand total
    const tasksSubtotal = await page.getByText(/tasks subtotal/i).textContent();
    const materialsSubtotal = await page.getByText(/materials subtotal/i).textContent();
    const grandTotal = await page.getByText(/grand total/i).textContent();
    
    // Extract numeric values (this is simplified, might need adjustment based on actual format)
    const tasksValue = parseFloat(tasksSubtotal?.replace(/[^0-9.]/g, '') || '0');
    const materialsValue = parseFloat(materialsSubtotal?.replace(/[^0-9.]/g, '') || '0');
    const totalValue = parseFloat(grandTotal?.replace(/[^0-9.]/g, '') || '0');
    
    // Verify the calculation (allowing for small rounding differences)
    expect(Math.abs((tasksValue + materialsValue) - totalValue)).toBeLessThanOrEqual(0.1);
  });

  test('should successfully create a quote with minimum required fields', async ({ page }) => {
    // Fill title
    await page.getByLabel(/title/i).fill('Test Quote');
    
    // Select customer
    await page.getByLabel(/customer/i).click();
    await page.getByRole('option').first().click();
    
    // Add a task
    await page.getByRole('button', { name: /add task/i }).click();
    await page.getByLabel(/task description/i).fill('Test Task');
    await page.getByLabel(/task price/i).fill('100');
    
    // Submit the form
    await page.getByRole('button', { name: /save/i }).click();
    
    // Should show success toast
    await expect(page.getByText(/quote created successfully/i)).toBeVisible();
    
    // Should navigate back to quotes list
    await expect(page).toHaveURL(/\/admin\/quotes/);
  });
}); 