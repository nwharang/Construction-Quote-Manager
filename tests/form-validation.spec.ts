import { test, expect } from '@playwright/test';

test.describe('Form Validation', () => {
  test('should validate quote creation form', async ({ page }) => {
    await page.goto('/quotes');
    
    // Open the create quote modal
    const createButton = await page.getByRole('button', { name: /create new quote/i });
    await createButton.click();
    
    // Try to submit the form without filling required fields
    const submitButton = page.getByRole('button', { name: /create|submit|save/i });
    await submitButton.click();
    
    // Check for validation errors
    const errors = page.locator('.error-message, [aria-invalid="true"], .invalid-feedback');
    await expect(errors).toBeVisible();
    
    // Check for specific error messages
    await expect(page.getByText(/project name.*required|required.*project name/i)).toBeVisible();
    await expect(page.getByText(/customer name.*required|required.*customer name/i)).toBeVisible();
  });

  test('should validate email format in quote creation', async ({ page }) => {
    await page.goto('/quotes');
    
    // Open the create quote modal
    const createButton = await page.getByRole('button', { name: /create new quote/i });
    await createButton.click();
    
    // Fill required fields
    await page.getByLabel(/project name/i).fill('Test Project');
    await page.getByLabel(/customer name/i).fill('Test Customer');
    
    // Enter invalid email
    await page.getByLabel(/customer email/i).fill('invalid-email');
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /create|submit|save/i });
    await submitButton.click();
    
    // Check for email validation error
    await expect(page.getByText(/invalid email|valid email/i)).toBeVisible();
    
    // Fix the email and verify validation passes
    await page.getByLabel(/customer email/i).clear();
    await page.getByLabel(/customer email/i).fill('valid@example.com');
    
    // Submit again
    await submitButton.click();
    
    // The modal should close if validation passes
    await expect(page.getByRole('heading', { name: /create new quote/i })).not.toBeVisible({ timeout: 2000 });
  });

  test('should validate task creation form', async ({ page }) => {
    // Navigate to a quote detail page
    await page.goto('/quotes/1');
    
    // Open add task modal/form
    const addTaskButton = await page.getByRole('button', { name: /add task/i });
    await addTaskButton.click();
    
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /save|add|submit/i });
    await submitButton.click();
    
    // Check for validation errors
    const errors = page.locator('.error-message, [aria-invalid="true"], .invalid-feedback');
    await expect(errors).toBeVisible();
    
    // Check for specific error messages
    await expect(page.getByText(/description.*required|required.*description/i)).toBeVisible();
    await expect(page.getByText(/task price.*required|required.*task price/i)).toBeVisible();
  });

  test('should validate numeric input fields', async ({ page }) => {
    // Navigate to a quote detail page
    await page.goto('/quotes/1');
    
    // Open add task modal/form
    const addTaskButton = await page.getByRole('button', { name: /add task/i });
    await addTaskButton.click();
    
    // Fill description but enter invalid numeric values
    await page.getByLabel(/description/i).fill('Test Task');
    await page.getByLabel(/task price/i).fill('abc');
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /save|add|submit/i });
    await submitButton.click();
    
    // Check for numeric validation error
    await expect(page.getByText(/must be a number|invalid number|number required/i)).toBeVisible();
    
    // Fix with valid number
    await page.getByLabel(/task price/i).clear();
    await page.getByLabel(/task price/i).fill('150');
    
    // For materials, also try invalid input if the field exists
    const materialsInput = page.getByLabel(/materials cost/i);
    if (await materialsInput.isVisible()) {
      await materialsInput.fill('xyz');
      await submitButton.click();
      
      // Should show error for invalid materials cost
      await expect(page.getByText(/must be a number|invalid number|number required/i)).toBeVisible();
      
      // Fix with valid number
      await materialsInput.clear();
      await materialsInput.fill('200');
    }
    
    // Submit with valid values
    await submitButton.click();
    
    // The modal should close if validation passes
    await expect(page.getByText(/add task|new task/i)).not.toBeVisible({ timeout: 2000 });
  });

  test('should validate signup form', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Try to submit the empty form
    const signupButton = page.getByRole('button', { name: /sign up/i });
    await signupButton.click();
    
    // Check for validation errors
    const errors = page.locator('.error-message, [aria-invalid="true"], .invalid-feedback');
    await expect(errors).toBeVisible();
    
    // Fill with invalid password (too short)
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/password/i).fill('short');
    await signupButton.click();
    
    // Should show password validation error
    await expect(page.getByText(/password must be|password should be|password is too short/i)).toBeVisible();
    
    // Fill with valid data
    await page.getByLabel(/password/i).clear();
    await page.getByLabel(/password/i).fill('StrongP@ss123');
    
    // Fill password confirmation if it exists
    const confirmPassword = page.getByLabel(/confirm password|repeat password/i);
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill('StrongP@ss123');
    }
    
    // Submit with valid data
    await signupButton.click();
    
    // Should redirect or show success message
    await expect(page).not.toHaveURL(/\/auth\/signup$/);
  });
}); 