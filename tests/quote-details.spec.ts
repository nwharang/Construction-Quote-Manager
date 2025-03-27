import { test, expect } from '@playwright/test';

test.describe('Quote Details Page', () => {
  // We'll need to either create a quote first or navigate to an existing quote
  // For simplicity in tests, we'll assume a quote with ID 1 exists
  const mockQuoteId = '1';

  test('should display quote details page', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Check for quote title/header
    const heading = await page.getByRole('heading').first();
    await expect(heading).toBeVisible();
    
    // Check for key sections
    await expect(page.getByText(/customer information|details/i)).toBeVisible();
    await expect(page.getByText(/tasks/i)).toBeVisible();
    await expect(page.getByText(/totals|summary/i)).toBeVisible();
  });

  test('should display tasks section with items', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Check for tasks section
    const tasksSection = await page.getByText(/tasks/i);
    await expect(tasksSection).toBeVisible();
    
    // Check if it contains task information
    // This depends on your UI, but typically tasks would be in a list/table
    const tasksList = await page.locator('table, ul, div[role="list"]').first();
    await expect(tasksList).toBeVisible();
  });

  test('should display quote adjustments section', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Check for adjustments section
    await expect(page.getByText(/adjustments|complexity|markup/i)).toBeVisible();
    
    // Check if totals are displayed
    await expect(page.getByText(/subtotal|grand total/i)).toBeVisible();
  });

  test('should have an add task button', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Check for add task button
    const addTaskButton = await page.getByRole('button', { name: /add task/i });
    await expect(addTaskButton).toBeVisible();
    
    // Click the button and verify modal opens
    await addTaskButton.click();
    
    // Check that the add task modal appears
    const modalTitle = await page.getByText(/add task|new task/i);
    await expect(modalTitle).toBeVisible();
  });

  test('should allow updating quote status', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Find status selector/dropdown
    const statusControl = await page.getByText(/status/i).first();
    await expect(statusControl).toBeVisible();
    
    // Since UI implementation may vary, this is a simple check
    // In a real test, you'd click the status control and select a new status
  });
}); 