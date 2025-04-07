import { test, expect } from '@playwright/test';

/**
 * Notifications tests for authenticated users
 * Tests the notification system functionality
 * @tags @auth
 */
test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard where notifications are typically accessible
    await page.goto('/admin/dashboard');
    
    // Ensure we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should have a notifications bell icon', async ({ page }) => {
    // Check for notifications bell icon in header
    await expect(page.getByTestId('notifications-bell')).toBeVisible();
  });

  test('should open notifications panel when clicking bell icon', async ({ page }) => {
    // Click on notifications bell
    await page.getByTestId('notifications-bell').click();
    
    // Check that notifications panel opens
    await expect(page.getByTestId('notifications-panel')).toBeVisible();
    await expect(page.getByText(/notifications/i)).toBeVisible();
  });

  test('should display notification items or empty state', async ({ page }) => {
    // Open notifications panel
    await page.getByTestId('notifications-bell').click();
    
    // Wait for panel to be visible
    await page.getByTestId('notifications-panel').waitFor();
    
    // Check for notification items or empty state
    const hasNotifications = await page.getByTestId('notification-item').first().isVisible();
    
    if (hasNotifications) {
      // Check that at least one notification is visible
      const notificationItems = await page.getByTestId('notification-item').all();
      expect(notificationItems.length).toBeGreaterThan(0);
      
      // Check notification structure (time, message, etc.)
      const firstNotification = notificationItems[0];
      await expect(firstNotification.getByTestId('notification-message')).toBeVisible();
      await expect(firstNotification.getByTestId('notification-time')).toBeVisible();
    } else {
      // Check for empty state message
      await expect(page.getByText(/no notifications/i)).toBeVisible();
    }
  });

  test('should mark notification as read when clicked', async ({ page }) => {
    // Open notifications panel
    await page.getByTestId('notifications-bell').click();
    
    // Wait for panel to be visible
    await page.getByTestId('notifications-panel').waitFor();
    
    // Check if there are any unread notifications
    const hasUnreadNotifications = await page.getByTestId('unread-notification').first().isVisible();
    
    if (hasUnreadNotifications) {
      // Get count of unread notifications before clicking
      const beforeCount = await page.getByTestId('unread-notification').count();
      
      // Click on first unread notification
      await page.getByTestId('unread-notification').first().click();
      
      // Close the panel (if it's still open)
      if (await page.getByTestId('notifications-panel').isVisible()) {
        await page.keyboard.press('Escape');
      }
      
      // Reopen notifications panel
      await page.getByTestId('notifications-bell').click();
      
      // Count unread notifications after clicking
      const afterCount = await page.getByTestId('unread-notification').count();
      
      // Should have one less unread notification
      expect(afterCount).toBeLessThan(beforeCount);
    } else {
      test.skip(true, 'No unread notifications available to test with');
    }
  });

  test('should have a mark all as read button', async ({ page }) => {
    // Open notifications panel
    await page.getByTestId('notifications-bell').click();
    
    // Wait for panel to be visible
    await page.getByTestId('notifications-panel').waitFor();
    
    // Check if there are any notifications
    const hasNotifications = await page.getByTestId('notification-item').first().isVisible();
    
    if (hasNotifications) {
      // Check for "Mark all as read" button
      await expect(page.getByRole('button', { name: /mark all as read/i })).toBeVisible();
    } else {
      test.skip(true, 'No notifications available to test with');
    }
  });

  test('should mark all notifications as read when clicking mark all button', async ({ page }) => {
    // Open notifications panel
    await page.getByTestId('notifications-bell').click();
    
    // Wait for panel to be visible
    await page.getByTestId('notifications-panel').waitFor();
    
    // Check if there are any unread notifications
    const hasUnreadNotifications = await page.getByTestId('unread-notification').first().isVisible();
    
    if (hasUnreadNotifications) {
      // Click "Mark all as read" button
      await page.getByRole('button', { name: /mark all as read/i }).click();
      
      // Should no longer show any unread notifications
      await expect(page.getByTestId('unread-notification')).toHaveCount(0);
    } else {
      test.skip(true, 'No unread notifications available to test with');
    }
  });

  test('should navigate to notification source when clicking notification', async ({ page }) => {
    // Open notifications panel
    await page.getByTestId('notifications-bell').click();
    
    // Wait for panel to be visible
    await page.getByTestId('notifications-panel').waitFor();
    
    // Check if there are any notifications
    const hasNotifications = await page.getByTestId('notification-item').first().isVisible();
    
    if (hasNotifications) {
      // Get current URL before clicking notification
      const beforeUrl = page.url();
      
      // Click on the first notification
      await page.getByTestId('notification-item').first().click();
      
      // URL should change as we navigate to the notification source
      await expect(page).not.toHaveURL(beforeUrl);
    } else {
      test.skip(true, 'No notifications available to test with');
    }
  });

  test('should display notification badge when there are unread notifications', async ({ page }) => {
    // Check if the notifications bell has a badge
    const hasBadge = await page.getByTestId('notifications-badge').isVisible();
    
    if (hasBadge) {
      // Badge should be visible if there are unread notifications
      await expect(page.getByTestId('notifications-badge')).toBeVisible();
      
      // Open notifications and mark all as read
      await page.getByTestId('notifications-bell').click();
      await page.getByRole('button', { name: /mark all as read/i }).click();
      
      // Close panel
      await page.keyboard.press('Escape');
      
      // Badge should no longer be visible
      await expect(page.getByTestId('notifications-badge')).not.toBeVisible();
    } else {
      // Skip if no badge is present (might not have unread notifications)
      test.skip(true, 'No notification badge visible to test with');
    }
  });
}); 