import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  // We'll need to either create a quote first or navigate to an existing quote
  const mockQuoteId = '1';

  test('should add a new task with lump sum materials cost', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Click the add task button
    const addTaskButton = await page.getByRole('button', { name: /add task/i });
    await addTaskButton.click();
    
    // Fill in the task form
    await page.getByLabel(/description/i).fill('Install new cabinets');
    await page.getByLabel(/task price/i).fill('500');
    
    // Select lump sum option for materials (implementation may vary)
    // This assumes there's a tab or radio button for lump sum vs. itemized
    const lumpSumOption = await page.getByText(/lump sum/i).first();
    if (await lumpSumOption.isVisible()) {
      await lumpSumOption.click();
    }
    
    await page.getByLabel(/materials cost/i).fill('1200');
    
    // Submit the form
    await page.getByRole('button', { name: /save|add|submit/i }).click();
    
    // Verify the task is added to the quote
    await expect(page.getByText('Install new cabinets')).toBeVisible();
    await expect(page.getByText('$500')).toBeVisible();
    await expect(page.getByText('$1200')).toBeVisible();
  });

  test('should add a task with itemized materials', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Click the add task button
    const addTaskButton = await page.getByRole('button', { name: /add task/i });
    await addTaskButton.click();
    
    // Fill in the task details
    await page.getByLabel(/description/i).fill('Install new flooring');
    await page.getByLabel(/task price/i).fill('800');
    
    // Select itemized option for materials (implementation may vary)
    const itemizedOption = await page.getByText(/itemized|items/i).first();
    if (await itemizedOption.isVisible()) {
      await itemizedOption.click();
    }
    
    // Add first material item
    await page.getByRole('button', { name: /add material|add item/i }).click();
    await page.getByLabel(/material name/i).fill('Vinyl Flooring');
    await page.getByLabel(/quantity/i).fill('100');
    await page.getByLabel(/unit price/i).fill('15');
    await page.getByRole('button', { name: /add|save material/i }).click();
    
    // Add second material item (if the UI allows)
    const addAnotherBtn = page.getByRole('button', { name: /add another|add material/i });
    if (await addAnotherBtn.isVisible()) {
      await addAnotherBtn.click();
      await page.getByLabel(/material name/i).fill('Underlayment');
      await page.getByLabel(/quantity/i).fill('10');
      await page.getByLabel(/unit price/i).fill('25');
      await page.getByRole('button', { name: /add|save material/i }).click();
    }
    
    // Submit the task form
    await page.getByRole('button', { name: /save|add|submit task/i }).click();
    
    // Verify the task and materials are added
    await expect(page.getByText('Install new flooring')).toBeVisible();
    await expect(page.getByText('$800')).toBeVisible();
    await expect(page.getByText('Vinyl Flooring')).toBeVisible();
  });

  test('should remove a task from quote', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Get the initial count of tasks
    const initialTasksCount = await page.locator('table tbody tr, ul li, div[role="listitem"]').count();
    
    // Find and click a remove/delete button on a task
    const removeButtons = await page.getByRole('button', { name: /remove|delete|trash/i });
    if (await removeButtons.count() > 0) {
      await removeButtons.first().click();
      
      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Verify task is removed
      const newTasksCount = await page.locator('table tbody tr, ul li, div[role="listitem"]').count();
      expect(newTasksCount).toBeLessThan(initialTasksCount);
    }
  });

  test('should update the quote totals when tasks are added', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Get initial totals
    const initialSubtotal = await page.getByText(/subtotal/i).textContent();
    
    // Add a new task
    const addTaskButton = await page.getByRole('button', { name: /add task/i });
    await addTaskButton.click();
    
    // Fill in task details
    await page.getByLabel(/description/i).fill('Test Task');
    await page.getByLabel(/task price/i).fill('100');
    await page.getByLabel(/materials cost/i).fill('200');
    
    // Submit the task
    await page.getByRole('button', { name: /save|add|submit/i }).click();
    
    // Verify totals are updated
    const updatedSubtotal = await page.getByText(/subtotal/i).textContent();
    expect(initialSubtotal).not.toEqual(updatedSubtotal);
  });
}); 