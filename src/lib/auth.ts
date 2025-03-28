import { randomBytes } from 'crypto';

/**
 * Generate a random token for session authentication
 * @returns Random token string
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calculate a date in the future based on the number of seconds
 * @param seconds Number of seconds in the future
 * @returns Date object
 */
export function fromDate(seconds: number): Date {
  const now = new Date();
  return new Date(now.getTime() + seconds * 1000);
}
