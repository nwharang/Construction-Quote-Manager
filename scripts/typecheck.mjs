#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

/**
 * Type check script for the project
 * This will run type checks for both application and test code
 */
async function runTypeCheck() {
  try {
    // Run TypeScript check for application code
    console.log('Checking application TypeScript...');
    execSync('pnpm exec tsc --noEmit', { 
      stdio: 'inherit',
      cwd: rootDir
    });
    console.log('✅ Application TypeScript check passed');

    // Run TypeScript check for test code
    console.log('\nChecking test TypeScript...');
    execSync('pnpm exec tsc -p tests/tsconfig.json --noEmit', { 
      stdio: 'inherit',
      cwd: rootDir
    });
    console.log('✅ Test TypeScript check passed');

    console.log('\n✅ All TypeScript checks passed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TypeScript check failed');
    process.exit(1);
  }
}

runTypeCheck(); 