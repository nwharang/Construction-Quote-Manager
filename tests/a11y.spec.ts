import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test: Home page should have no critical accessibility violations
test('Home page should have no critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  // Filter for critical issues
  const criticalIssues = accessibilityScanResults.violations.filter(
    violation => violation.impact === 'critical'
  );
  
  // Output violations for debugging
  if (criticalIssues.length > 0) {
    console.log('Critical accessibility violations found:');
    criticalIssues.forEach(violation => {
      console.log(`- ${violation.help}: ${violation.description}`);
      console.log(`  Help URL: ${violation.helpUrl}`);
      console.log(`  Affected nodes: ${violation.nodes.length}`);
    });
  }
  
  expect(criticalIssues.length).toBe(0);
});

// Test: Sign in page should have no critical accessibility violations
test('Sign in page should have no critical accessibility violations', async ({ page }) => {
  await page.goto('/auth/signin');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  // Filter for critical issues
  const criticalIssues = accessibilityScanResults.violations.filter(
    violation => violation.impact === 'critical'
  );
  
  // Output violations for debugging
  if (criticalIssues.length > 0) {
    console.log('Critical accessibility violations found:');
    criticalIssues.forEach(violation => {
      console.log(`- ${violation.help}: ${violation.description}`);
      console.log(`  Help URL: ${violation.helpUrl}`);
      console.log(`  Affected nodes: ${violation.nodes.length}`);
    });
  }
  
  expect(criticalIssues.length).toBe(0);
});

// Test: Form labels and inputs should be properly associated
test('Form inputs and labels should be properly associated', async ({ page }) => {
  await page.goto('/auth/signin');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  // Look for label-related violations
  const labelViolations = accessibilityScanResults.violations.filter(
    violation => violation.id === 'label' || 
                 violation.id === 'label-content-name-mismatch' || 
                 violation.id === 'form-field-multiple-labels'
  );
  
  // Output violations for debugging
  if (labelViolations.length > 0) {
    console.log('Label-related accessibility violations found:');
    labelViolations.forEach(violation => {
      console.log(`- ${violation.help}: ${violation.description}`);
      console.log(`  Help URL: ${violation.helpUrl}`);
      console.log(`  Affected nodes: ${violation.nodes.length}`);
    });
  }
  
  expect(labelViolations.length).toBe(0);
}); 