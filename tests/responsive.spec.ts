import { test, expect, devices } from '@playwright/test';
import type { Page } from '@playwright/test';
import { authenticateUser } from './utils';

/**
 * Responsive Design Tests
 * 
 * Tests the application's responsiveness across different viewport sizes:
 * - Mobile view (small screens)
 * - Tablet view (medium screens)
 * - Desktop view (large screens)
 * 
 * Verifies that:
 * - Layout adapts properly to different screen sizes
 * - Navigation is accessible on mobile devices
 * - Forms and interactive elements are usable across devices
 * - Critical content remains visible and functional
 */
test.describe('Responsive Design', () => {
  // Authentication helper to sign in before tests
  async function loginUser(page: Page) {
    await authenticateUser(page);
  }

  test.describe('Mobile View', () => {
    // Use iPhone 12 as a mobile device
    test.use({ viewport: devices['iPhone 12'].viewport });
    
    test.beforeEach(async ({ page }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 390, height: 844 });
    });
    
    test('homepage should be usable on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Check if hamburger menu or mobile navigation is present
      const mobileNav = page.getByRole('button', { name: /menu|navigation/i });
      await expect(mobileNav).toBeVisible();
      
      // Test opening mobile navigation
      await mobileNav.click();
      
      // Navigation links should be accessible
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });
    
    test('sign-in form should be properly laid out on mobile', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Form should be properly visible and centered
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      
      // Form fields should be properly sized for mobile
      const emailInput = page.getByLabel('Email');
      await expect(emailInput).toBeVisible();
      
      // Input width should adapt to viewport
      const inputBounds = await emailInput.boundingBox();
      if (inputBounds) {
        // Input should not overflow viewport and have reasonable width
        expect(inputBounds.width).toBeLessThan(page.viewportSize()!.width);
        expect(inputBounds.width).toBeGreaterThan(page.viewportSize()!.width * 0.5);
      }
    });
    
    test('authenticated dashboard should adapt to mobile view', async ({ page }) => {
      await loginUser(page);
      await page.goto('/dashboard');
      
      // Check if hamburger menu is present in authenticated view
      const mobileNav = page.getByRole('button', { name: /menu|navigation/i });
      await expect(mobileNav).toBeVisible();
      
      // Open hamburger menu
      await mobileNav.click();
      
      // Wait for menu to open
      await page.waitForTimeout(300);
      
      // User's name or profile link should be visible
      await expect(page.getByText(/dashboard|quotes|products/i)).toBeVisible();
    });
    
    test('quotes list should adapt to mobile view', async ({ page }) => {
      await loginUser(page);
      await page.goto('/quotes');
      
      // Check for mobile-optimized table or list view
      // Tables often transform to cards in responsive designs
      
      // Check for presence of quotes data
      // We're looking for either a table that's resized or a card-based layout
      const quoteElements = page.locator('table, [role="table"], [data-testid="quote-item"], .quote-card');
      await expect(quoteElements.first()).toBeVisible();
      
      // Create quote button should be visible and accessible
      await expect(page.getByRole('button', { name: /create|new quote/i })).toBeVisible();
    });
  });
  
  test.describe('Tablet View', () => {
    // Use iPad as a tablet device
    test.use({ viewport: devices['iPad (gen 7)'].viewport });
    
    test.beforeEach(async ({ page }) => {
      // Set viewport to tablet size
      await page.setViewportSize({ width: 768, height: 1024 });
    });
    
    test('homepage should adapt to tablet layout', async ({ page }) => {
      await page.goto('/');
      
      // Navigation might be directly visible or in a menu
      try {
        // Try to find direct navigation first
        const navLinks = page.getByRole('link', { name: /sign in|sign up|home/i });
        await expect(navLinks.first()).toBeVisible();
      } catch (e) {
        // If not directly visible, look for a menu button
        const menuButton = page.getByRole('button', { name: /menu|navigation/i });
        await expect(menuButton).toBeVisible();
        
        // Test menu functionality
        await menuButton.click();
        await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
      }
    });
    
    test('authenticated dashboard should have appropriate tablet layout', async ({ page }) => {
      await loginUser(page);
      await page.goto('/dashboard');
      
      // On tablets, sidebar might be visible or collapsed
      // Try both options
      const sidebarOrNav = page.locator('nav, aside, [role="navigation"]');
      
      if (await sidebarOrNav.isVisible()) {
        // If sidebar is visible, check it has appropriate content
        await expect(sidebarOrNav.getByText(/dashboard|quotes|products/i)).toBeVisible();
      } else {
        // If not visible by default, check for a toggle
        const menuToggle = page.getByRole('button', { name: /menu|navigation|sidebar/i });
        
        if (await menuToggle.isVisible()) {
          await menuToggle.click();
          await expect(page.getByText(/dashboard|quotes|products/i)).toBeVisible();
        }
      }
    });
    
    test('create quote form should be properly laid out on tablet', async ({ page }) => {
      await loginUser(page);
      await page.goto('/quotes');
      
      // Open create quote form
      await page.getByRole('button', { name: /create|new quote/i }).click();
      
      // Form should be properly sized for tablet
      const formElements = page.locator('form, [role="dialog"]');
      await expect(formElements.first()).toBeVisible();
      
      // Form should have appropriate width for tablet
      const formBounds = await formElements.first().boundingBox();
      if (formBounds) {
        // Form should have reasonable width relative to viewport
        expect(formBounds.width).toBeLessThan(page.viewportSize()!.width * 0.9);
        expect(formBounds.width).toBeGreaterThan(page.viewportSize()!.width * 0.5);
      }
    });
  });
  
  test.describe('Desktop View', () => {
    // Use a standard desktop size
    test.use({ viewport: { width: 1280, height: 800 } });
    
    test.beforeEach(async ({ page }) => {
      // Set viewport to desktop size
      await page.setViewportSize({ width: 1280, height: 800 });
    });
    
    test('homepage should show full desktop navigation', async ({ page }) => {
      await page.goto('/');
      
      // On desktop, navigation should be fully visible
      const navLinks = page.getByRole('link', { name: /sign in|sign up|home/i });
      await expect(navLinks.first()).toBeVisible();
      
      // Hamburger menu should not be visible on desktop
      const mobileNav = page.getByRole('button', { name: /menu|navigation/i });
      expect(await mobileNav.isVisible()).toBeFalsy();
    });
    
    test('dashboard should show full sidebar on desktop', async ({ page }) => {
      await loginUser(page);
      await page.goto('/dashboard');
      
      // Sidebar should be visible by default on desktop
      const sidebar = page.locator('nav, aside, [role="navigation"]');
      await expect(sidebar).toBeVisible();
      
      // Check for main content area with appropriate layout
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
      
      // Desktop layout should have sidebar and main content side by side
      // Get the position of sidebar and main content
      const sidebarBounds = await sidebar.boundingBox();
      const mainContentBounds = await mainContent.boundingBox();
      
      if (sidebarBounds && mainContentBounds) {
        // Check if layout is side-by-side (sidebar left of main content)
        // or if sidebar is at least visible and not taking full width
        expect(
          (sidebarBounds.x < mainContentBounds.x) || // Side by side
          (sidebarBounds.width < page.viewportSize()!.width * 0.3) // Or compact sidebar
        ).toBeTruthy();
      }
    });
    
    test('quotes list should show full table layout on desktop', async ({ page }) => {
      await loginUser(page);
      await page.goto('/quotes');
      
      // On desktop, quotes should be displayed in a table layout
      const table = page.locator('table, [role="table"]');
      await expect(table).toBeVisible();
      
      // Table headers should be visible
      const headers = table.locator('th, [role="columnheader"]');
      expect(await headers.count()).toBeGreaterThan(1);
    });
    
    test('create quote form should utilize desktop space effectively', async ({ page }) => {
      await loginUser(page);
      await page.goto('/quotes');
      
      // Open create quote form
      await page.getByRole('button', { name: /create|new quote/i }).click();
      
      // Form should have appropriate desktop layout - not too wide, not too narrow
      const formElement = page.locator('form, [role="dialog"]');
      await expect(formElement).toBeVisible();
      
      const formBounds = await formElement.boundingBox();
      if (formBounds) {
        // Form shouldn't take the full width on desktop
        expect(formBounds.width).toBeLessThan(page.viewportSize()!.width * 0.9);
        // But it should be wide enough to be usable
        expect(formBounds.width).toBeGreaterThan(400);
      }
    });
  });
  
  test.describe('Responsive Behavior', () => {
    test('should adapt layout when resizing viewport', async ({ page }) => {
      // Start with mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check for mobile navigation (hamburger menu)
      const mobileNav = page.getByRole('button', { name: /menu|navigation/i });
      const isMobileNavVisible = await mobileNav.isVisible();
      
      // Resize to desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 });
      
      // Allow time for responsive layout to adjust
      await page.waitForTimeout(500);
      
      // Check if layout changed
      if (isMobileNavVisible) {
        // If mobile nav was visible before, it might be hidden now
        // or normal navigation links might be visible
        const desktopNavLinks = page.getByRole('link', { name: /sign in|sign up|home/i });
        await expect(desktopNavLinks.first()).toBeVisible();
      }
    });
    
    test('should maintain functionality when switching between device sizes', async ({ page }) => {
      // Start on mobile
      await page.setViewportSize({ width: 390, height: 844 });
      await loginUser(page);
      
      // Navigate to quotes
      await page.goto('/quotes');
      
      // Verify functionality in mobile mode
      await expect(page.getByRole('button', { name: /create|new quote/i })).toBeVisible();
      
      // Resize to desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 });
      
      // Allow time for responsive layout to adjust
      await page.waitForTimeout(500);
      
      // Verify same core functionality works in desktop mode
      await expect(page.getByRole('button', { name: /create|new quote/i })).toBeVisible();
      
      // Try to access a core feature
      await page.getByRole('button', { name: /create|new quote/i }).click();
      
      // Verify the feature works regardless of viewport size
      await expect(page.getByLabel(/project name/i)).toBeVisible();
    });
    
    test('should correctly handle orientation changes', async ({ page }) => {
      // Start with mobile portrait viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await loginUser(page);
      await page.goto('/quotes');
      
      // Check layout in portrait mode
      const portraitElements = await page.locator('header').count();
      
      // Switch to landscape orientation
      await page.setViewportSize({ width: 667, height: 375 });
      
      // Allow time for responsive layout to adjust
      await page.waitForTimeout(500);
      
      // Verify the app still functions in landscape
      await expect(page.getByRole('button', { name: /create|new quote/i })).toBeVisible();
      
      // Core content should still be accessible
      const landscapeElements = await page.locator('header').count();
      
      // App should maintain its structure
      expect(landscapeElements).toEqual(portraitElements);
    });
  });
}); 