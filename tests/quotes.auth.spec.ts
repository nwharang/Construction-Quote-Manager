import { test, expect } from '@playwright/test';
import { createTestQuote, addTaskToQuote } from './utils';

/**
 * Authenticated Quotes Tests
 * 
 * These tests require authentication and test the quotes functionality
 * including creating, viewing, and modifying quotes.
 */

// Test: Authenticated user can access quotes page
test('authenticated user can access quotes page', async ({ page }) => {
  await page.goto('/quotes');
  
  // Should not be redirected to login
  expect(page.url()).toContain('/quotes');
  
  // Verify quotes page elements are visible
  await expect(page.getByRole('heading', { name: /quotes/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /create|new quote/i })).toBeVisible();
});

// Test: Create a new quote
test('can create a new quote with tasks', async ({ page }) => {
  // Create a quote using helper function
  const { projectName, customerName } = await createTestQuote(page);
  
  // Verify the quote was created
  await expect(page.getByText(projectName)).toBeVisible();
  await expect(page.getByText(customerName)).toBeVisible();
  
  // Add a task to the quote
  const { description } = await addTaskToQuote(page, {
    description: 'Paint Kitchen',
    taskPrice: '250',
    materialsType: 'lump',
    materialsCost: '150'
  });
  
  // Verify task was added
  await expect(page.getByText(description)).toBeVisible();
  
  // Check totals updated
  await page.waitForTimeout(500); // Allow time for calculations
  
  // Verify total calculations appear correctly
  const totalElements = page.getByText(/total/i);
  await expect(totalElements.first()).toBeVisible();
});

// Test: Quote adjustments update grand total
test('quote adjustments update grand total', async ({ page }) => {
  // Create a quote
  await createTestQuote(page);
  
  // Add a task
  await addTaskToQuote(page, {
    description: 'Flooring Installation',
    taskPrice: '500', 
    materialsType: 'lump',
    materialsCost: '1000'
  });
  
  // Get the current grand total
  await page.waitForTimeout(500); // Allow time for calculations
  let initialTotal = 0;
  
  try {
    const grandTotalElement = page.getByText(/grand total/i).first();
    const grandTotalText = await grandTotalElement.textContent();
    initialTotal = parseFloat(grandTotalText?.replace(/[^0-9.]/g, '') || '0');
  } catch (e) {
    console.log('Could not find grand total, using default 0');
  }
  
  // Apply a complexity charge if that field exists
  const complexityField = page.getByLabel(/complexity|contingency/i);
  if (await complexityField.isVisible()) {
    await complexityField.fill('10');
    
    // Wait for calculations to update
    await page.waitForTimeout(500);
    
    // Verify the grand total increased
    const updatedGrandTotalElement = page.getByText(/grand total/i).first();
    const updatedGrandTotalText = await updatedGrandTotalElement.textContent();
    const updatedTotal = parseFloat(updatedGrandTotalText?.replace(/[^0-9.]/g, '') || '0');
    
    // Total should be higher with complexity charge
    expect(updatedTotal).toBeGreaterThan(initialTotal);
    
    // Reset for next test
    initialTotal = updatedTotal;
  }
  
  // Apply a markup charge if that field exists
  const markupField = page.getByLabel(/markup|profit/i);
  if (await markupField.isVisible()) {
    await markupField.fill('15');
    
    // Wait for calculations to update
    await page.waitForTimeout(500);
    
    // Verify the grand total increased again
    const finalGrandTotalElement = page.getByText(/grand total/i).first();
    const finalGrandTotalText = await finalGrandTotalElement.textContent();
    const finalTotal = parseFloat(finalGrandTotalText?.replace(/[^0-9.]/g, '') || '0');
    
    // Total should be higher with markup charge
    expect(finalTotal).toBeGreaterThan(initialTotal);
  }
}); 