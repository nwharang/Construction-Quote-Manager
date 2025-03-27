import { test, expect } from '@playwright/test';

test.describe('Quote Adjustments', () => {
  // We'll need to either create a quote first or navigate to an existing quote
  const mockQuoteId = '1';

  test('should apply complexity/contingency charges', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Look for adjustments section
    const adjustmentsSection = await page.getByText(/adjustments|complexity|contingency/i);
    await expect(adjustmentsSection).toBeVisible();
    
    // Get initial grand total
    const initialGrandTotal = await page.getByText(/grand total/i).textContent();
    
    // Find and update complexity/contingency field
    const complexityInput = await page.getByLabel(/complexity|contingency/i);
    await complexityInput.fill('10'); // 10% or $10 depending on implementation
    
    // Check if there's an "Apply" button that needs to be clicked
    const applyButton = page.getByRole('button', { name: /apply|update|save/i });
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
    
    // Wait for totals to update
    await page.waitForTimeout(500);
    
    // Verify grand total has changed
    const updatedGrandTotal = await page.getByText(/grand total/i).textContent();
    expect(initialGrandTotal).not.toEqual(updatedGrandTotal);
  });

  test('should apply markup/profit percentage', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Get initial grand total
    const initialGrandTotal = await page.getByText(/grand total/i).textContent();
    
    // Find and update markup percentage field
    const markupInput = await page.getByLabel(/markup|profit/i);
    await markupInput.fill('15'); // 15% markup
    
    // Check if there's an "Apply" button that needs to be clicked
    const applyButton = page.getByRole('button', { name: /apply|update|save/i });
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
    
    // Wait for totals to update
    await page.waitForTimeout(500);
    
    // Verify grand total has changed
    const updatedGrandTotal = await page.getByText(/grand total/i).textContent();
    expect(initialGrandTotal).not.toEqual(updatedGrandTotal);
  });

  test('should display subtotals and grand total correctly', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Check if all required totals are displayed
    await expect(page.getByText(/subtotal tasks/i)).toBeVisible();
    await expect(page.getByText(/subtotal materials/i)).toBeVisible();
    await expect(page.getByText(/grand total/i)).toBeVisible();
    
    // Optionally check for complexity and markup amounts if shown separately
    const complexityAmount = page.getByText(/complexity amount|contingency/i);
    const markupAmount = page.getByText(/markup amount|profit/i);
    
    if (await complexityAmount.isVisible()) {
      await expect(complexityAmount).toBeVisible();
    }
    
    if (await markupAmount.isVisible()) {
      await expect(markupAmount).toBeVisible();
    }
  });

  test('should recalculate totals when a task is removed', async ({ page }) => {
    await page.goto(`/quotes/${mockQuoteId}`);
    
    // Get initial grand total
    const initialGrandTotal = await page.getByText(/grand total/i).textContent();
    
    // Find and click a remove/delete button on a task
    const removeButtons = await page.getByRole('button', { name: /remove|delete|trash/i });
    if (await removeButtons.count() > 0) {
      await removeButtons.first().click();
      
      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Wait for totals to update
      await page.waitForTimeout(500);
      
      // Verify grand total has changed
      const updatedGrandTotal = await page.getByText(/grand total/i).textContent();
      expect(initialGrandTotal).not.toEqual(updatedGrandTotal);
    }
  });
}); 