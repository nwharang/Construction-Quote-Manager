import { Page } from '@playwright/test';

/**
 * Type for material items used in tasks
 */
interface Material {
  name: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Helper function to authenticate a user with the demo credentials
 * Uses the same selector strategy as global.setup.ts for consistency
 */
export async function authenticateUser(page: Page): Promise<void> {
  // Navigate to the sign-in page
  await page.goto('/auth/signin');
  
  // Ensure we're on the login page
  await page.waitForSelector('form', { state: 'visible' });
  
  // Fill in the demo credentials using more specific selectors
  await page.locator('input[name="email"]').fill('demo@example.com');
  await page.locator('input[name="password"]').fill('Password123!');
  
  // Click the sign-in button
  await page.locator('button[type="submit"]').click();
  
  // Wait for navigation to complete indicating successful login
  await page.waitForURL(/\/(quotes|dashboard)/, { timeout: 10000 });
  
  // Verify we're authenticated by checking for a dashboard or quotes element
  await page.waitForSelector('h1', { state: 'visible' });
}

/**
 * Helper function to create a new quote and return its ID
 */
export async function createTestQuote(page: Page, data = {
  projectName: 'Test Project',
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerPhone: '555-123-4567',
  projectAddress: '123 Test St'
}) {
  // Go to quotes page
  await page.goto('/quotes');

  // Click create quote button
  await page.getByRole('button', { name: /create|new quote/i }).click();

  // Fill in the quote details
  await page.getByLabel(/project name/i).fill(data.projectName);
  await page.getByLabel(/customer name/i).fill(data.customerName);
  await page.getByLabel(/customer email/i).fill(data.customerEmail);
  await page.getByLabel(/phone/i).fill(data.customerPhone);
  await page.getByLabel(/address/i).fill(data.projectAddress);

  // Submit the form
  await page.getByRole('button', { name: /create|submit|save/i }).click();

  // Wait for navigation or confirmation
  await page.waitForURL(/\/quotes\/\w+/);

  return data;
}

/**
 * Helper function to add a task to a quote
 */
export async function addTaskToQuote(page: Page, options: {
  description?: string;
  taskPrice?: string;
  materialsType?: 'lump' | 'itemized';
  materialsCost?: string;
  materials?: Material[];
} = {}) {
  const defaults = {
    description: 'Test Task',
    taskPrice: '100',
    materialsType: 'lump' as const,
    materialsCost: '50',
    materials: [] as Material[]
  };

  const data = { ...defaults, ...options };
  
  // Click add task button
  await page.getByRole('button', { name: /add task/i }).click();
  
  // Fill task details
  await page.getByLabel(/description/i).fill(data.description);
  await page.getByLabel(/task price/i).fill(data.taskPrice);
  
  // Handle materials cost based on type
  if (data.materialsType === 'lump') {
    // Select lump sum option if available
    const lumpSumOption = page.getByText(/lump sum/i);
    if (await lumpSumOption.isVisible()) {
      await lumpSumOption.click();
    }
    
    // Fill materials cost
    await page.getByLabel(/materials cost/i).fill(data.materialsCost);
  } else if (data.materialsType === 'itemized' && data.materials.length > 0) {
    // Select itemized option if available
    const itemizedOption = page.getByText(/itemized|items/i);
    if (await itemizedOption.isVisible()) {
      await itemizedOption.click();
    }
    
    // Add material items
    for (const material of data.materials) {
      await page.getByRole('button', { name: /add material|add item/i }).click();
      await page.getByLabel(/material name/i).fill(material.name);
      await page.getByLabel(/quantity/i).fill(material.quantity.toString());
      await page.getByLabel(/unit price/i).fill(material.unitPrice.toString());
      await page.getByRole('button', { name: /add|save material/i }).click();
    }
  }
  
  // Save the task
  await page.getByRole('button', { name: /save|add task/i }).click();
  
  return { description: data.description, taskPrice: data.taskPrice };
} 