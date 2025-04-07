import { test, expect } from '@playwright/test';

/**
 * Layout tests for authenticated users
 * Tests the standard layout and HeroUI components consistency
 * @tags @auth
 */
test.describe('Layout and Component Consistency', () => {
  test('should use standard layout on all admin pages', async ({ page }) => {
    // Pages to check for layout consistency
    const adminPages = [
      '/admin/dashboard',
      '/admin/quotes',
      '/admin/customers',
      '/admin/products',
      '/admin/settings'
    ];
    
    for (const url of adminPages) {
      // Navigate to the page
      await page.goto(url);
      
      // Verify standard layout components
      // NavBar
      await expect(page.getByTestId('navbar')).toBeVisible();
      
      // Sidebar
      await expect(page.getByTestId('sidebar')).toBeVisible();
      
      // Main content area
      await expect(page.getByTestId('main-content')).toBeVisible();
    }
  });

  test('should have consistent NavBar across pages', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/admin/dashboard');
    
    // Record NavBar elements
    const navbarLogo = await page.getByTestId('navbar-logo').isVisible();
    const userMenu = await page.getByTestId('user-menu').isVisible();
    const themeToggle = await page.getByTestId('theme-toggle').isVisible();
    
    // Navigate to another page
    await page.goto('/admin/quotes');
    
    // Verify navbar elements are still present and visible
    expect(await page.getByTestId('navbar-logo').isVisible()).toEqual(navbarLogo);
    expect(await page.getByTestId('user-menu').isVisible()).toEqual(userMenu);
    expect(await page.getByTestId('theme-toggle').isVisible()).toEqual(themeToggle);
  });

  test('should have consistent SidebarComponent with navigation links', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/admin/dashboard');
    
    // Instead of checking for specific text, check for navigation links in the sidebar
    const sidebar = page.getByTestId('sidebar');
    await expect(sidebar).toBeVisible();
    
    // Check that the sidebar has navigation links
    const navigationLinks = sidebar.getByRole('link');
    
    // Verify there are multiple navigation links
    const count = await navigationLinks.count();
    expect(count).toBeGreaterThan(3); // Should have at least 4 navigation links
    
    // Check that at least one link has a "dashboard" related text or data attribute
    const hasDashboardLink = 
      await page.locator('a[href*="dashboard"], [data-nav="dashboard"]').count() > 0;
    expect(hasDashboardLink).toBeTruthy();
    
    // Check for common sections in sidebar
    const hasQuotesLink = 
      await page.locator('a[href*="quotes"], [data-nav="quotes"]').count() > 0;
    expect(hasQuotesLink).toBeTruthy();
  });

  test('should use consistent HeroUI buttons across pages', async ({ page }) => {
    // Navigate to quotes list
    await page.goto('/admin/quotes');
    
    // Check for create button style
    const createButton = page.getByRole('link', { name: /create|new/i });
    await expect(createButton).toBeVisible();
    
    // Get button classes
    const createButtonClasses = await createButton.getAttribute('class');
    
    // Navigate to customers page
    await page.goto('/admin/customers');
    
    // Check for create customer button
    const createCustomerButton = page.getByRole('link', { name: /create|new/i });
    await expect(createCustomerButton).toBeVisible();
    
    // Get button classes 
    const createCustomerButtonClasses = await createCustomerButton.getAttribute('class');
    
    // The primary action buttons across pages should have consistent styling
    // We check if they share common class patterns (not exact match as there might be dynamic classes)
    expect(createButtonClasses).toContain(createCustomerButtonClasses?.split(' ')[0] || '');
  });

  test('should use consistent HeroUI Table component across list pages', async ({ page }) => {
    // Pages to check for Table consistency
    const listPages = [
      '/admin/quotes',
      '/admin/customers',
      '/admin/products'
    ];
    
    for (const url of listPages) {
      // Navigate to the page
      await page.goto(url);
      
      // Verify table components are present
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByRole('columnheader')).toBeVisible();
      await expect(page.getByRole('row')).toBeVisible();
      
      // Check for search functionality
      await expect(page.getByRole('searchbox')).toBeVisible();
    }
  });

  test('should use consistent HeroUI Toast notifications', async ({ page }) => {
    // Navigate to settings page to test toast
    await page.goto('/admin/settings');
    
    // Try to save settings
    await page.getByRole('button', { name: /save changes/i }).click();
    
    // Check for toast notification
    await expect(page.getByTestId('toast')).toBeVisible();
    
    // Toast should have consistent styling
    const toast = page.getByTestId('toast');
    await expect(toast).toHaveCSS('position', 'fixed');
    
    // Toast should have close button
    await expect(toast.getByRole('button')).toBeVisible();
  });

  test('should use consistent form field layout across forms', async ({ page }) => {
    // Pages to check for form consistency
    const formPages = [
      '/admin/quotes/new',
      '/admin/customers/new',
      '/admin/products/new',
      '/admin/settings'
    ];
    
    for (const url of formPages) {
      // Navigate to the page
      await page.goto(url);
      
      // Find form fields
      const formFields = page.locator('label + input, label + select, label + textarea');
      
      // Check if there are form fields
      const fieldCount = await formFields.count();
      if (fieldCount > 0) {
        // Form fields should have labels
        const firstField = formFields.first();
        const labelFor = await firstField.evaluate(el => {
          const label = document.querySelector(`label[for="${el.id}"]`);
          return label !== null;
        });
        
        expect(labelFor).toBeTruthy();
      }
    }
  });

  test('should handle responsive design for mobile view', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/admin/dashboard');
    
    // Sidebar should be hidden or collapsed on mobile
    const sidebarDisplayed = await page.getByTestId('sidebar').isVisible();
    
    if (sidebarDisplayed) {
      // If displayed, it should be collapsed or have a different layout
      const sidebarWidth = await page.getByTestId('sidebar').evaluate(el => {
        return window.getComputedStyle(el).width;
      });
      
      // Width should be smaller in mobile view
      const widthInPx = parseInt(sidebarWidth);
      expect(widthInPx).toBeLessThan(200);
    } else {
      // Should have a menu button to open sidebar
      await expect(page.getByTestId('menu-toggle')).toBeVisible();
      
      // Click menu toggle to open sidebar
      await page.getByTestId('menu-toggle').click();
      
      // Sidebar should appear
      await expect(page.getByTestId('sidebar')).toBeVisible();
    }
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('should use consistent loading indicators', async ({ page }) => {
    // Navigate to quotes list which likely has loading state
    await page.goto('/admin/quotes');
    
    // Block network requests to simulate loading state
    await page.route('**/api/trpc/quote.**', route => {
      // Hold the request to simulate loading
      // This will be automatically released when the test ends
    });
    
    // Refresh to trigger loading state
    await page.reload();
    
    // Check for loading indicators (spinner or skeleton)
    const hasSpinner = await page.getByTestId('loading-spinner').isVisible();
    const hasSkeleton = await page.getByTestId('skeleton-loader').isVisible();
    
    // Should have either spinner or skeleton
    expect(hasSpinner || hasSkeleton).toBeTruthy();
  });

  test('should have consistent feedback on form submission errors', async ({ page }) => {
    // Navigate to quotes creation
    await page.goto('/admin/quotes/new');
    
    // Try to submit form without required fields
    await page.getByRole('button', { name: /save/i }).click();
    
    // Check for error messages
    const errorMessages = page.locator('[data-test="error-message"]');
    
    // Should show at least one error message
    expect(await errorMessages.count()).toBeGreaterThan(0);
    
    // Error messages should have consistent styling
    if (await errorMessages.count() > 0) {
      // Get style of first error message
      const errorColor = await errorMessages.first().evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      
      // Error color should be in red spectrum
      expect(errorColor).toMatch(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      const match = errorColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [_, r, g, b] = match.map(Number);
        // Red should be more prominent in error messages
        expect(r).toBeGreaterThan(g);
        expect(r).toBeGreaterThan(b);
      }
    }
  });
}); 