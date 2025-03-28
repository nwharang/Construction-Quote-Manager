import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

/**
 * Standalone script to prepare the test environment
 * 
 * Usage:
 * pnpm tsx tests/prepare-tests.ts
 * 
 * This will:
 * 1. Create the auth directory if it doesn't exist
 * 2. Try to authenticate and save the storage state
 * 3. Or create an empty storage state if authentication fails
 */
async function prepareTests() {
  console.log('Preparing test environment...');
  
  // Create the auth directory if it doesn't exist
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`Created auth directory: ${authDir}`);
  }
  
  // Storage state path
  const storageStatePath = path.join(authDir, 'storage-state.json');
  
  try {
    // Try to authenticate and save storage state
    console.log('Attempting to authenticate...');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to sign-in page
    await page.goto('http://localhost:3000/auth/signin');
    
    // Wait for form to be visible
    await page.waitForSelector('form', { state: 'visible' });
    
    // Fill in credentials
    await page.locator('input[name="email"]').fill('demo@example.com');
    await page.locator('input[name="password"]').fill('Password123!');
    
    // Click submit
    await page.locator('button[type="submit"]').click();
    
    // Wait for a moment to see if navigation occurs
    try {
      await page.waitForURL(/\/(quotes|dashboard)/, { timeout: 5000 });
      console.log('Successfully authenticated!');
      
      // Save the authenticated state
      await context.storageState({ path: storageStatePath });
      console.log(`Saved authenticated storage state to: ${storageStatePath}`);
    } catch (e) {
      console.log('Authentication not successful, creating empty storage state');
      
      // Save an empty storage state
      const emptyState = { cookies: [], origins: [] };
      fs.writeFileSync(storageStatePath, JSON.stringify(emptyState, null, 2));
      console.log(`Created empty storage state at: ${storageStatePath}`);
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('Error preparing tests:', error);
    process.exit(1);
  }
  
  console.log('Test preparation completed!');
}

// Run the preparation function
prepareTests().catch(console.error); 