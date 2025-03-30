/**
 * Creates an accessible ID by combining a prefix and suffix
 * Used to ensure unique IDs for form elements and their associated labels
 * 
 * @param prefix The prefix for the ID (usually component or form related)
 * @param suffix The suffix for the ID (usually field name)
 * @returns A unique ID string
 */
export function createAccessibleId(prefix: string, suffix: string): string {
  // Sanitize inputs to ensure valid HTML IDs
  const sanitizedPrefix = prefix.replace(/[^a-zA-Z0-9-_]/g, '');
  const sanitizedSuffix = suffix.replace(/[^a-zA-Z0-9-_]/g, '');
  
  return `${sanitizedPrefix}-${sanitizedSuffix}`;
} 