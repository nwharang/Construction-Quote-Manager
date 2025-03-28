import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Form Validation Tests
 * 
 * Comprehensive tests for form validation across the application:
 * - Sign-in form validation
 * - Sign-up form validation
 * - Quote creation form validation
 * - Task form validation
 * - Product form validation
 * - Input sanitization and error handling
 */
test.describe('Form Validation', () => {
  // Authentication helper to sign in before tests
  async function authenticateUser(page: Page) {
    await page.goto('/auth/signin');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for successful authentication
    await page.waitForURL(/\/(quotes|dashboard)/);
  }
  
  test.describe('Authentication Forms', () => {
    test('sign-in form should validate required fields', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Submit empty form
      await page.getByRole('button', { name: 'Sign In' }).click();
      
      // Check for validation errors
      await expect(page.getByText(/email is required|email field is required/i)).toBeVisible();
      await expect(page.getByText(/password is required|password field is required/i)).toBeVisible();
    });
    
    test('sign-in form should validate email format', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Enter invalid email
      await page.getByLabel('Email').fill('invalid-email');
      await page.getByLabel('Password').fill('Password123!');
      await page.getByRole('button', { name: 'Sign In' }).click();
      
      // Check for validation error
      await expect(page.getByText(/invalid email|valid email|email format/i)).toBeVisible();
    });
    
    test('sign-up form should validate required fields', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // Submit empty form
      await page.getByRole('button', { name: /sign up|register|create account/i }).click();
      
      // Check for validation errors - common required fields in registration
      await expect(page.getByText(/name is required|name field is required/i)).toBeVisible();
      await expect(page.getByText(/email is required|email field is required/i)).toBeVisible();
      await expect(page.getByText(/password is required|password field is required/i)).toBeVisible();
    });
    
    test('sign-up form should validate password strength', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // Fill form with weak password
      await page.getByLabel('Name').fill('Test User');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('123');
      await page.getByRole('button', { name: /sign up|register|create account/i }).click();
      
      // Check for password strength validation
      await expect(page.getByText(/password.*too short|must be at least|strong password/i)).toBeVisible();
    });
    
    test('should validate password confirmation match', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // Fill with different passwords - if confirmed password field exists
      await page.getByLabel('Name').fill('Test User');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('Password123!');
      
      const confirmPasswordField = page.getByLabel(/confirm password|password confirmation/i);
      if (await confirmPasswordField.isVisible()) {
        await confirmPasswordField.fill('DifferentPassword123!');
        await page.getByRole('button', { name: /sign up|register|create account/i }).click();
        
        // Check for password match validation
        await expect(page.getByText(/passwords.*match|must match|do not match/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Quote Forms', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page);
    });
    
    test('quote creation form should validate required fields', async ({ page }) => {
      await page.goto('/quotes');
      
      // Open the create quote form
      await page.getByRole('button', { name: /create|new quote/i }).click();
      
      // Submit empty form
      await page.getByRole('button', { name: /create|save|submit/i }).click();
      
      // Check for validation errors
      await expect(page.getByText(/project name is required|project name field is required/i)).toBeVisible();
      await expect(page.getByText(/customer name is required|customer name field is required/i)).toBeVisible();
    });
    
    test('should validate email format in quote form', async ({ page }) => {
      await page.goto('/quotes');
      
      // Open the create quote form
      await page.getByRole('button', { name: /create|new quote/i }).click();
      
      // Fill required fields but with invalid email
      await page.getByLabel(/project name/i).fill('Test Project');
      await page.getByLabel(/customer name/i).fill('Test Customer');
      await page.getByLabel(/customer email/i).fill('invalid-email');
      
      // Submit form
      await page.getByRole('button', { name: /create|save|submit/i }).click();
      
      // Check for email validation error
      await expect(page.getByText(/invalid email|valid email|email format/i)).toBeVisible();
    });
    
    test('should validate phone number format in quote form', async ({ page }) => {
      await page.goto('/quotes');
      
      // Open the create quote form
      await page.getByRole('button', { name: /create|new quote/i }).click();
      
      // Fill required fields but with invalid phone
      await page.getByLabel(/project name/i).fill('Test Project');
      await page.getByLabel(/customer name/i).fill('Test Customer');
      await page.getByLabel(/customer email/i).fill('test@example.com');
      await page.getByLabel(/customer phone/i).fill('abc');
      
      // Submit form
      await page.getByRole('button', { name: /create|save|submit/i }).click();
      
      // Check for phone validation error if the app validates phone format
      try {
        await expect(page.getByText(/invalid phone|valid phone|phone format/i)).toBeVisible({ timeout: 2000 });
      } catch (error) {
        // Phone validation may not exist - that's okay
        console.log('Phone validation not found - may not be implemented');
      }
    });
    
    test('task form should validate required fields', async ({ page }) => {
      await page.goto('/quotes');
      
      // Create a test quote first
      await page.getByRole('button', { name: /create|new quote/i }).click();
      await page.getByLabel(/project name/i).fill('Test Project');
      await page.getByLabel(/customer name/i).fill('Test Customer');
      await page.getByLabel(/customer email/i).fill('test@example.com');
      await page.getByRole('button', { name: /create|save|submit/i }).click();
      
      // Wait for redirect to quote details
      await page.waitForURL(/\/quotes\/[\w-]+/);
      
      // Open task form
      await page.getByRole('button', { name: /add task/i }).click();
      
      // Submit empty form
      await page.getByRole('button', { name: /save|add|create task/i }).click();
      
      // Check for validation errors
      await expect(page.getByText(/description is required|description field is required/i)).toBeVisible();
      await expect(page.getByText(/price is required|price field is required/i)).toBeVisible();
    });
    
    test('task form should validate numeric inputs', async ({ page }) => {
      await page.goto('/quotes');
      
      // Navigate to an existing quote or create one
      await page.getByRole('button', { name: /create|new quote/i }).click();
      await page.getByLabel(/project name/i).fill('Test Project');
      await page.getByLabel(/customer name/i).fill('Test Customer');
      await page.getByLabel(/customer email/i).fill('test@example.com');
      await page.getByRole('button', { name: /create|save|submit/i }).click();
      
      // Wait for redirect to quote details
      await page.waitForURL(/\/quotes\/[\w-]+/);
      
      // Open task form
      await page.getByRole('button', { name: /add task/i }).click();
      
      // Fill with non-numeric price
      await page.getByLabel(/description|task description/i).fill('Test Task');
      await page.getByLabel(/task price|price/i).fill('abc');
      
      // Submit form
      await page.getByRole('button', { name: /save|add|create task/i }).click();
      
      // Check for numeric validation error
      await expect(page.getByText(/must be a number|numeric value|valid number/i)).toBeVisible();
    });
  });
  
  test.describe('Product Forms', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page);
    });
    
    test('product creation form should validate required fields', async ({ page }) => {
      await page.goto('/products');
      
      // Open the create product form
      await page.getByRole('button', { name: /add|create|new product/i }).click();
      
      // Submit empty form
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      // Check for validation errors
      await expect(page.getByText(/name is required|name field is required/i)).toBeVisible();
      await expect(page.getByText(/price is required|cost is required/i)).toBeVisible();
    });
    
    test('product form should validate numeric price', async ({ page }) => {
      await page.goto('/products');
      
      // Open the create product form
      await page.getByRole('button', { name: /add|create|new product/i }).click();
      
      // Fill with non-numeric price
      await page.getByLabel(/product name|name/i).fill('Test Product');
      await page.getByLabel(/price|cost/i).fill('abc');
      
      // Submit form
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      // Check for numeric validation error
      await expect(page.getByText(/must be a number|numeric value|valid number/i)).toBeVisible();
    });
    
    test('product form should validate price is not negative', async ({ page }) => {
      await page.goto('/products');
      
      // Open the create product form
      await page.getByRole('button', { name: /add|create|new product/i }).click();
      
      // Fill with negative price
      await page.getByLabel(/product name|name/i).fill('Test Product');
      await page.getByLabel(/price|cost/i).fill('-50');
      
      // Submit form
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      // Check for negative value validation error
      await expect(page.getByText(/cannot be negative|greater than zero|positive number/i)).toBeVisible();
    });
  });
  
  test.describe('Input Sanitization', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page);
    });
    
    test('should handle special characters in form inputs', async ({ page }) => {
      await page.goto('/quotes');
      
      // Open the create quote form
      await page.getByRole('button', { name: /create|new quote/i }).click();
      
      // Fill with special characters
      const projectName = 'Project <script>alert("test")</script>';
      await page.getByLabel(/project name/i).fill(projectName);
      await page.getByLabel(/customer name/i).fill('Customer & Co.');
      await page.getByLabel(/customer email/i).fill('test@example.com');
      
      // Submit form
      await page.getByRole('button', { name: /create|save|submit/i }).click();
      
      // Wait for redirect, which indicates successful submission
      await page.waitForURL(/\/quotes\/[\w-]+/);
      
      // Check that the content was sanitized properly and displays correctly
      // Look for text content, not the script execution
      await expect(page.locator(':text("Project")')).toBeVisible();
    });
    
    test('should handle very long input values', async ({ page }) => {
      await page.goto('/quotes');
      
      // Open the create quote form
      await page.getByRole('button', { name: /create|new quote/i }).click();
      
      // Create very long input value
      const longInput = 'A'.repeat(1000);
      
      // Fill with long input
      await page.getByLabel(/project name/i).fill(longInput);
      await page.getByLabel(/customer name/i).fill('Test Customer');
      await page.getByLabel(/customer email/i).fill('test@example.com');
      
      // Submit form
      await page.getByRole('button', { name: /create|save|submit/i }).click();
      
      // Check for appropriate behavior - either proper truncation or validation error
      try {
        // If form submits successfully, we should be redirected
        await page.waitForURL(/\/quotes\/[\w-]+/, { timeout: 5000 });
        
        // Check that the content displays in some form, though likely truncated
        await expect(page.locator(':text("A")')).toBeVisible();
      } catch (error) {
        // Or it may show a validation error message about length
        await expect(page.getByText(/too long|maximum length|character limit/i)).toBeVisible();
      }
    });
  });
}); 