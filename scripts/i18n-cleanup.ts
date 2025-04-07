// Find and clean unused i18n translation keys in one go
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths configuration
const KEYS_FILE_PATH = path.join(__dirname, '..', 'src', 'types', 'i18n', 'keys.ts');
const SOURCE_DIR = path.join(__dirname, '..', 'src');
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'utils', 'locales');
const IGNORED_DIRS = ['node_modules', '.next', 'dist', 'build'];

// Type definitions
interface KeyUsageResult {
  usedKeys: string[];
  unusedKeys: string[];
}

interface GroupedKeys {
  [category: string]: string[];
}

/**
 * Main function that finds and cleans unused translation keys in one go
 */
async function cleanupI18n(): Promise<void> {
  console.log('Starting i18n cleanup process...');
  console.log('Step 1: Finding unused translation keys...');
  
  // Extract all defined keys
  const definedKeys = extractDefinedKeys();
  if (definedKeys.length === 0) {
    console.log('No translation keys found. Exiting...');
    return;
  }
  
  // Find all source files
  const sourceFiles = findSourceFiles();
  if (sourceFiles.length === 0) {
    console.log('No source files found. Exiting...');
    return;
  }
  
  // Check which keys are unused
  const { usedKeys, unusedKeys } = checkKeyUsage(definedKeys, sourceFiles);
  
  // Output results
  console.log('\n=== SCAN RESULTS ===');
  console.log(`Total keys: ${definedKeys.length}`);
  console.log(`Used keys: ${usedKeys.length}`);
  console.log(`Unused keys: ${unusedKeys.length}`);
  
  if (unusedKeys.length === 0) {
    console.log('\nGreat job! No unused translation keys found.');
    return;
  }
  
  // Group unused keys by prefix for better reporting
  const groupedUnused = groupKeysByCategory(unusedKeys);
  
  console.log('\nUnused keys by category:');
  Object.entries(groupedUnused)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([category, keys]) => {
      console.log(`- ${category}: ${keys.length} keys`);
    });
  
  // Proceed with cleanup
  console.log('\nStep 2: Cleaning up unused translation keys...');
  
  // Create backups and clean up type definition
  cleanupTypeDefinition(unusedKeys);
  
  // Clean up locale files
  cleanupLocaleFiles(unusedKeys);
  
  console.log('\nCleanup complete!');
}

/**
 * Extract all defined translation keys from the keys.ts file
 */
function extractDefinedKeys(): string[] {
  console.log('Extracting translation keys from definition file...');
  
  try {
    const content = fs.readFileSync(KEYS_FILE_PATH, 'utf8');
    const keys: string[] = [];
    
    // Find the TranslationKey type definition
    const typeMatch = content.match(/export\s+type\s+TranslationKey\s*=([^;]+);/s);
    
    if (!typeMatch || !typeMatch[1]) {
      console.error('Could not find TranslationKey type definition in:', KEYS_FILE_PATH);
      return [];
    }
    
    // Extract the key strings from the union type
    const keyPattern = /'([^']+)'/g;
    let match: RegExpExecArray | null;
    
    while ((match = keyPattern.exec(typeMatch[1])) !== null) {
      const key = match[1];
      if (key && !key.includes('${')) { // Exclude template literals
        keys.push(key);
      }
    }
    
    console.log(`Found ${keys.length} defined translation keys.`);
    return keys;
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error reading keys file:', errorMessage);
    return [];
  }
}

/**
 * Find all source files that might contain translation key usage
 */
function findSourceFiles(): string[] {
  console.log('Finding source files...');
  
  // Use command line to get files faster
  try {
    let cmd: string;
    if (process.platform === 'win32') {
      // Windows - use PowerShell
      cmd = `powershell -Command "Get-ChildItem -Path '${SOURCE_DIR}' -Recurse -File | Where-Object { $_.Extension -match '\\.tsx?$' } | Select-Object -ExpandProperty FullName"`;
    } else {
      // Unix-like - use find
      cmd = `find ${SOURCE_DIR} -type f \\( -name "*.ts" -o -name "*.tsx" \\) | grep -v "node_modules" | grep -v ".next"`;
    }
    
    const output = execSync(cmd, { encoding: 'utf8' });
    const files = output.split(/\r?\n/).filter(Boolean);
    
    console.log(`Found ${files.length} source files.`);
    return files;
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error finding source files:', errorMessage);
    console.log('Falling back to recursive search...');
    
    // Fallback to manual recursive search if command line fails
    const files: string[] = [];
    
    function walkDir(dir: string): void {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!IGNORED_DIRS.includes(entry.name)) {
            walkDir(fullPath);
          }
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }
    
    walkDir(SOURCE_DIR);
    console.log(`Found ${files.length} source files (via fallback).`);
    return files;
  }
}

/**
 * Check if each key is used in any source file
 */
function checkKeyUsage(keys: string[], files: string[]): KeyUsageResult {
  console.log('Checking for key usage in source files...');
  
  const usedKeys = new Set<string>();
  const unusedKeys: string[] = [];
  
  // Process each key
  for (const key of keys) {
    let isUsed = false;
    
    // Search patterns for finding key usage
    const patterns = [
      // t('key')
      new RegExp(`t\\(['"]${escapeRegExp(key)}['"]\\)`, 'g'),
      // t("key")
      new RegExp(`t\\(['"]${escapeRegExp(key)}['"]`, 'g'),
      // 'key' as const
      new RegExp(`['"]${escapeRegExp(key)}['"]\\s+as\\s+const`, 'g'),
    ];
    
    // Check each file for the key
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            isUsed = true;
            usedKeys.add(key);
            break;
          }
        }
        
        if (isUsed) break; // No need to check more files if key is used
        
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Error reading file ${file}:`, errorMessage);
      }
    }
    
    if (!isUsed) {
      unusedKeys.push(key);
    }
    
    // Show progress every 50 keys
    if ((keys.indexOf(key) + 1) % 50 === 0) {
      console.log(`Processed ${keys.indexOf(key) + 1}/${keys.length} keys...`);
    }
  }
  
  return { usedKeys: Array.from(usedKeys), unusedKeys };
}

/**
 * Helper function to escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Group keys by their category (first segment before dot)
 */
function groupKeysByCategory(keys: string[]): GroupedKeys {
  const grouped: GroupedKeys = {};
  
  keys.forEach((key: string) => {
    const category = key.split('.')[0];
    if (category) {
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(key);
    }
  });
  
  return grouped;
}

/**
 * Clean up the type definition file by removing unused keys
 */
function cleanupTypeDefinition(unusedKeys: string[]): void {
  // Read the keys.ts file
  let keysFileContent: string;
  try {
    keysFileContent = fs.readFileSync(KEYS_FILE_PATH, 'utf8');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error reading keys file:', errorMessage);
    return;
  }

  // Create a backup
  const backupPath = `${KEYS_FILE_PATH}.bak`;
  fs.writeFileSync(backupPath, keysFileContent);
  console.log(`Created backup at: ${backupPath}`);

  // Remove the keys
  let cleanedContent = keysFileContent;
  let removedCount = 0;

  unusedKeys.forEach((key: string) => {
    // Escape special characters for regex
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match the key in the union type with optional whitespace and trailing pipe
    const keyPattern = new RegExp(`[\\s|]*'${escapedKey}'[\\s]*\\|?`, 'g');
    
    const beforeLength = cleanedContent.length;
    cleanedContent = cleanedContent.replace(keyPattern, '');
    
    if (cleanedContent.length !== beforeLength) {
      removedCount++;
    }
  });

  // Fix double pipes that might result from removing keys
  cleanedContent = cleanedContent.replace(/\|\s*\|/g, '|');

  // Write the cleaned file
  fs.writeFileSync(KEYS_FILE_PATH, cleanedContent);

  console.log(`Successfully removed ${removedCount} unused translation keys from the type definition.`);
}

/**
 * Clean up locale files by removing unused keys
 */
function cleanupLocaleFiles(unusedKeys: string[]): void {
  // Get all locale files
  const localeFiles = fs.readdirSync(LOCALES_DIR).filter(file => file.endsWith('.ts'));

  console.log(`\nCleaning up ${localeFiles.length} locale files...`);

  localeFiles.forEach((file: string) => {
    const filePath = path.join(LOCALES_DIR, file);
    let localeContent = fs.readFileSync(filePath, 'utf8');
    let localeRemovedCount = 0;
    
    // Create a backup of locale file
    const localeBackupPath = `${filePath}.bak`;
    fs.writeFileSync(localeBackupPath, fs.readFileSync(filePath));
    
    unusedKeys.forEach((key: string) => {
      // Escape special characters for regex
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Match the key in locale file
      const keyPattern = new RegExp(`[\\s]*'${escapedKey}':[^,]+,?`, 'g');
      
      const beforeLength = localeContent.length;
      localeContent = localeContent.replace(keyPattern, '');
      
      if (localeContent.length !== beforeLength) {
        localeRemovedCount++;
      }
    });
    
    // Fix consecutive commas that might result from removing entries
    localeContent = localeContent.replace(/,\s*,/g, ',');
    
    // Write the cleaned locale file
    fs.writeFileSync(filePath, localeContent);
    
    console.log(`Cleaned ${localeRemovedCount} entries from ${file}`);
  });
}

// Run the main function
cleanupI18n().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 