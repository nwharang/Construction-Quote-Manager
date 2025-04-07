import { test, expect } from '@playwright/test';

/**
 * Profile Management tests for authenticated users
 * Tests the user profile settings functionality
 * @tags @auth
 */
test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile settings
    await page.goto('/admin/profile');
    
    // Ensure we're on the profile page
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  test('should display user profile information', async ({ page }) => {
    // Check for profile information sections
    await expect(page.getByText(/personal information/i)).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should display password change section', async ({ page }) => {
    // Check for password change section
    await expect(page.getByText(/change password/i)).toBeVisible();
    await expect(page.getByLabel(/current password/i)).toBeVisible();
    await expect(page.getByLabel(/new password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  });

  test('should validate profile update form', async ({ page }) => {
    // Find name field and clear it
    await page.getByLabel(/name/i).clear();
    
    // Try to save with empty name
    await page.getByRole('button', { name: /save changes/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test('should successfully update profile information', async ({ page }) => {
    // Get current name
    const nameField = page.getByLabel(/name/i);
    const currentName = await nameField.inputValue();
    
    // Generate a new name
    const newName = `${currentName} (Updated ${Date.now().toString().slice(-4)})`;
    
    // Update name
    await nameField.clear();
    await nameField.fill(newName);
    
    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click();
    
    // Should show success message
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible();
    
    // Reload the page to verify changes persisted
    await page.reload();
    
    // Check if name was updated
    await expect(nameField).toHaveValue(newName);
    
    // Restore original name if it was changed
    if (currentName && currentName !== newName) {
      await nameField.clear();
      await nameField.fill(currentName);
      await page.getByRole('button', { name: /save changes/i }).click();
    }
  });

  test('should validate password change form', async ({ page }) => {
    // Try to change password without providing current password
    await page.getByLabel(/new password/i).fill('NewPass123!');
    await page.getByLabel(/confirm password/i).fill('NewPass123!');
    
    // Click change password button
    await page.getByRole('button', { name: /change password/i }).click();
    
    // Should show validation error for current password
    await expect(page.getByText(/current password is required/i)).toBeVisible();
  });

  test('should validate password mismatch', async ({ page }) => {
    // Fill password fields with mismatched passwords
    await page.getByLabel(/current password/i).fill('CurrentPass123');
    await page.getByLabel(/new password/i).fill('NewPass123!');
    await page.getByLabel(/confirm password/i).fill('DifferentPass123!');
    
    // Click change password button
    await page.getByRole('button', { name: /change password/i }).click();
    
    // Should show password mismatch error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should display notification preferences', async ({ page }) => {
    // Check if notification preferences section exists
    const hasNotificationSection = await page.getByText(/notification preferences/i).isVisible();
    
    if (hasNotificationSection) {
      // Check for common notification toggles
      await expect(page.getByText(/email notifications/i)).toBeVisible();
      
      // Check that at least one toggle is present
      const toggleCount = await page.getByRole('switch').count();
      expect(toggleCount).toBeGreaterThan(0);
    } else {
      // Skip this test if notification preferences aren't implemented
      test.skip(true, 'Notification preferences section not available');
    }
  });

  test('should display profile picture upload option', async ({ page }) => {
    // Check if profile picture section exists
    const hasProfilePicture = await page.getByText(/profile picture/i).isVisible();
    
    if (hasProfilePicture) {
      // Check for image upload functionality
      await expect(page.getByText(/upload/i)).toBeVisible();
      
      // Check that file input exists
      const fileInputExists = await page.locator('input[type="file"]').count() > 0;
      expect(fileInputExists).toBeTruthy();
    } else {
      // Skip this test if profile picture upload isn't implemented
      test.skip(true, 'Profile picture upload not available');
    }
  });
}); 