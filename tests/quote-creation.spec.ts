import { test, expect } from '@playwright/test';

test.describe('Quote Creation Workflow', () => {
  test('should create a complete quote with all steps', async ({ page }) => {
    // Step 1: Navigate to quotes page and open create modal
    await page.goto('/quotes');
    const createButton = await page.getByRole('button', { name: /create new quote/i });
    await createButton.click();
    
    // Step 2: Fill basic quote information
    const projectName = `Project ${Date.now()}`;
    const customerName = 'John Smith';
    await page.getByLabel(/project name/i).fill(projectName);
    await page.getByLabel(/customer name/i).fill(customerName);
    await page.getByLabel(/customer email/i).fill('john.smith@example.com');
    await page.getByLabel(/customer phone/i).fill('555-123-4567');
    await page.getByLabel(/notes/i).fill('This is a test quote with full workflow');
    
    // Submit the form to create quote
    await page.getByRole('button', { name: /create|submit|save/i }).click();
    
    // Wait for redirect to the new quote details page
    // Note: URL might include a new ID - we'll extract it from the URL
    await page.waitForURL(/\/quotes\/\w+/);
    
    // Extract quote ID from URL for later use
    const url = page.url();
    const quoteId = url.split('/').pop() || '1';
    
    // Step 3: Verify the quote details page shows our new quote
    await expect(page.getByText(projectName)).toBeVisible();
    await expect(page.getByText(customerName)).toBeVisible();
    
    // Step 4: Add a task with lump sum materials
    const addTaskButton = await page.getByRole('button', { name: /add task/i });
    await addTaskButton.click();
    
    // Fill task details
    await page.getByLabel(/description/i).fill('Paint Living Room');
    await page.getByLabel(/task price/i).fill('350');
    
    // Select lump sum option for materials if available
    const lumpSumOption = page.getByText(/lump sum/i);
    if (await lumpSumOption.isVisible()) {
      await lumpSumOption.click();
    }
    
    // Fill materials cost
    await page.getByLabel(/materials cost/i).fill('150');
    
    // Save the task
    await page.getByRole('button', { name: /save|add|submit task/i }).click();
    
    // Verify task was added to the quote
    await expect(page.getByText('Paint Living Room')).toBeVisible();
    await expect(page.getByText('$350')).toBeVisible();
    await expect(page.getByText('$150')).toBeVisible();
    
    // Step 5: Add another task with itemized materials
    await addTaskButton.click();
    
    // Fill task details
    await page.getByLabel(/description/i).fill('Install Flooring');
    await page.getByLabel(/task price/i).fill('575');
    
    // Select itemized option if available
    const itemizedOption = page.getByText(/itemized|items/i);
    if (await itemizedOption.isVisible()) {
      await itemizedOption.click();
      
      // Add material items
      const addMaterialButton = page.getByRole('button', { name: /add material|add item/i });
      
      if (await addMaterialButton.isVisible()) {
        await addMaterialButton.click();
        
        // Fill first material
        await page.getByLabel(/material name/i).fill('Hardwood Flooring');
        await page.getByLabel(/quantity/i).fill('200');
        await page.getByLabel(/unit price/i).fill('5.75');
        await page.getByRole('button', { name: /add|save material/i }).click();
        
        // Add second material if UI allows
        if (await addMaterialButton.isVisible()) {
          await addMaterialButton.click();
          await page.getByLabel(/material name/i).fill('Floor Underlayment');
          await page.getByLabel(/quantity/i).fill('200');
          await page.getByLabel(/unit price/i).fill('1.25');
          await page.getByRole('button', { name: /add|save material/i }).click();
        }
      }
    } else {
      // If itemized not available, use lump sum
      await page.getByLabel(/materials cost/i).fill('1400');
    }
    
    // Save the task
    await page.getByRole('button', { name: /save|add|submit task/i }).click();
    
    // Verify the new task was added
    await expect(page.getByText('Install Flooring')).toBeVisible();
    await expect(page.getByText('$575')).toBeVisible();
    
    // Step 6: Apply adjustments
    // Check for complexity and markup inputs
    const complexityInput = page.getByLabel(/complexity|contingency/i);
    if (await complexityInput.isVisible()) {
      await complexityInput.fill('10');
    }
    
    const markupInput = page.getByLabel(/markup|profit/i);
    if (await markupInput.isVisible()) {
      await markupInput.fill('15');
    }
    
    // Apply adjustments if there's a separate button
    const applyButton = page.getByRole('button', { name: /apply|update/i });
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
    
    // Step 7: Verify subtotals and grand total are calculated
    await expect(page.getByText(/subtotal tasks/i)).toBeVisible();
    await expect(page.getByText(/subtotal materials/i)).toBeVisible();
    await expect(page.getByText(/grand total/i)).toBeVisible();
    
    // Check that the totals have numeric values
    const grandTotalText = await page.getByText(/grand total/i).textContent();
    expect(grandTotalText).toMatch(/\$\d+/);
    
    // Step 8: Update quote status
    const statusDropdown = page.getByText(/status|draft/i).first();
    if (await statusDropdown.isVisible()) {
      await statusDropdown.click();
      
      // Select "Sent" status or equivalent
      const sentOption = page.getByRole('option', { name: /sent/i });
      if (await sentOption.isVisible()) {
        await sentOption.click();
      } else {
        // Try alternative - might be a button instead of dropdown
        const sentButton = page.getByRole('button', { name: /sent/i });
        if (await sentButton.isVisible()) {
          await sentButton.click();
        }
      }
      
      // Verify status changed
      await expect(page.getByText(/sent/i)).toBeVisible();
    }
    
    // Step 9: Navigate back to quotes list and verify new quote appears
    await page.goto('/quotes');
    
    // Verify new quote is in the list
    await expect(page.getByText(projectName)).toBeVisible();
    
    // Step 10: Go back to the quote for final verification
    await page.getByText(projectName).click();
    
    // Verify we're on the correct quote page
    expect(page.url()).toContain(`/quotes/${quoteId}`);
    await expect(page.getByText(projectName)).toBeVisible();
    await expect(page.getByText('Paint Living Room')).toBeVisible();
    await expect(page.getByText('Install Flooring')).toBeVisible();
  });
}); 